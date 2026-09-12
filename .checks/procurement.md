# Procurement

Sources:

- [WAL-2](https://linear.app/tech-leads-club/issue/WAL-2/procurement-supplier-purchase-e-receipt-from-purchase) — 27 criteria, states, out of scope, Unresolved (do not settle)
- `.design/procurement.md` — **binding for the interface**: journey, HTTP, Shape, Decisions, tela Procurement
- `ROADMAP.md` — fase 5 delivers Supplier, Purchase, Receipt from a Purchase
- `CONTEXT.md` — Receipt is not Purchase; Movement is the only Stock writer
- `docs/specs/job.md` — trio, unique on the index, delete with FK → 409, session without 403
- `apps/api/src/services/job.service.ts` — create/delete/unique/FK mold
- `apps/api/src/services/movement.service.ts` — `createReceipt` and `isPositiveQuantity`
- `apps/api/src/db/schema.ts` and `apply-schema.ts` — `movements` without `purchase_id` today
- `apps/web/src/App.tsx` — Job and Inventory as the screen precedent
- AGENTS.md — layers, errors, unit + integration, Playwright not persisted

Profile: `light` (AGENTS.md has no `tlc-implement` block). Thin for a binding screen — it cannot catch a screen nobody built or arrangement vs copy. Screen checks C20–C25 stay because WAL-2 names them and AGENTS.md Screens requires Playwright MCP.

## Out of scope

- Staff and Assignment — fase 6, does not unblock this
- Requisition — fase 7, consumes Purchase
- Partial / second Receipt / lines / Warehouse different at the dock — refused in the design
- Finance, RFQ, price, 403, delete/update of Movement, killing the free Receipt, PATCH of Purchase
- Receipt on Purchase create — Purchase would write Stock
- Optional `purchaseId` on `POST /api/receipts` — reopens the Inventory spec
- Own repository suite — AGENTS.md forbids
- Playwright spec committed — the journey runs at the end and the file does not stay
- Unresolved 1 — leave `Item has Stock` / `Warehouse has Stock` strings
- Unresolved 2 — UUID `id`, no human Purchase number

## Landing

Supplier and Purchase copy the Job trio. Stock is written only by `MovementService` via `MovementRepository.apply`. Receive is `POST /api/purchases/:id/receipts` → `createReceiptFromPurchase`. The Procurement screen copies Job list/create/delete and Inventory's free Receipt.

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| Purchase does not write Stock | Only `MovementService` writes Stock. `POST /api/purchases` does not call `apply`. Receive is `MovementService.createReceiptFromPurchase(purchaseId)` | Create of Purchase already does Receipt — removes the “order not yet arrived” state Requisition needs |
| One Receipt closes the Purchase | `POST /api/purchases/:id/receipts` with no body. Quantity and Warehouse come from the Purchase. Unique on `movements.purchase_id` when set. Second receive → `409` `Purchase already received` | Partial / remaining — if one Purchase arrives on two trucks. Changing later costs the unique and the `purchases` shape |
| Purchase shape | One `itemId`, one `quantity` (> 0, finite), one `supplierId`, one `warehouseId`. No lines, no `purchases.status` | Lines or Warehouse only on the Receipt — if the dock can diverge; `purchases.status` — if Requisition lists by status |
| Existing `movements` tables gain `purchase_id` | `apply-schema` CREATE TABLE includes `purchase_id`; if `PRAGMA table_info(movements)` lacks it, `ALTER TABLE` adds the nullable column and `movements_purchase_id_unique` | Wipe the classroom DB — drops the seeded Administrator on every schema change |

- Nothing else in this change is hard to reverse

## Checks

### S1 - Supplier · Job mold 16 KB + wiring 10 KB + new ~15 KB · ~10k

**C1** - `GET /api/suppliers` on an empty table returns `200` and `[]`
Proof: `bun test apps/api/test/suppliers.integration.test.ts --test-name-pattern "C1 GET /api/suppliers on empty table returns 200 \\[\\]"`

**C2** - `POST /api/suppliers` `{ "name": "  Acme  " }` returns `201` `{ id, name: "Acme", createdAt }` with UUID `id` and ISO-8601 `createdAt`; `GET /api/suppliers` contains that record; `GET /api/purchases` is `[]`; `GET /api/stock` equals the value from before the POST
Proof: `bun test apps/api/src/services/supplier.service.test.ts --test-name-pattern "C2 create trims name and persists UUID id and ISO-8601 createdAt"`
Proof: `bun test apps/api/test/suppliers.integration.test.ts --test-name-pattern "C2 POST /api/suppliers trims name, lists the record, leaves purchases empty and stock unchanged"`

**C3** - Given a Supplier named Acme, `POST /api/suppliers` `{ "name": "Acme" }` returns `409` `{ "error": "Supplier already exists", "statusCode": 409 }`; `GET /api/suppliers` still has one Acme
Proof: `bun test apps/api/src/services/supplier.service.test.ts --test-name-pattern "C3 create maps a unique-constraint error to 409 Supplier already exists"`
Proof: `bun test apps/api/test/suppliers.integration.test.ts --test-name-pattern "C3 POST /api/suppliers duplicate name returns 409 and keeps one Acme"`

**C4** - `POST /api/suppliers` with `name` `""` or `"   "` returns `400` `{ "error": "name is required", "statusCode": 400 }`; the repository is not called
Proof: `bun test apps/api/src/services/supplier.service.test.ts --test-name-pattern "C4 create with blank or whitespace name throws 400 and does not call repository.create"`
Proof: `bun test apps/api/test/suppliers.integration.test.ts --test-name-pattern "C4 POST /api/suppliers with blank or whitespace name returns 400"`

**C5** - Given a Supplier with no Purchase, `DELETE /api/suppliers/:id` returns `204` and `GET /api/suppliers` does not contain it
Proof: `bun test apps/api/src/services/supplier.service.test.ts --test-name-pattern "C5 deleteById succeeds when the repository deletes the row"`
Proof: `bun test apps/api/test/suppliers.integration.test.ts --test-name-pattern "C5 DELETE /api/suppliers/:id returns 204 and removes the Supplier"`

**C6** - Given a Supplier with a Purchase, `DELETE /api/suppliers/:id` returns `409` `{ "error": "Supplier has Purchase", "statusCode": 409 }`; the Supplier and the Purchase remain
Proof: `bun test apps/api/src/services/supplier.service.test.ts --test-name-pattern "C6 deleteById maps a foreign-key error to 409 Supplier has Purchase"`
Proof: `bun test apps/api/test/suppliers.integration.test.ts --test-name-pattern "C6 DELETE /api/suppliers/:id with a Purchase returns 409 and keeps both"`

**C7** - `DELETE /api/suppliers/00000000-0000-4000-8000-000000000000` returns `404` `{ "error": "Supplier not found", "statusCode": 404 }`
Proof: `bun test apps/api/src/services/supplier.service.test.ts --test-name-pattern "C7 deleteById throws 404 when the repository deletes nothing"`
Proof: `bun test apps/api/test/suppliers.integration.test.ts --test-name-pattern "C7 DELETE /api/suppliers/:id missing id returns 404"`

### S2 - Purchase · Job mold 16 KB + new ~18 KB · ~11k

**C8** - `GET /api/purchases` on an empty table returns `200` and `[]`
Proof: `bun test apps/api/test/purchases.integration.test.ts --test-name-pattern "C8 GET /api/purchases on empty table returns 200 \\[\\]"`

**C9** - Given Supplier S, Item I, Warehouse W and `GET /api/stock` equal to R, `POST /api/purchases` `{ "supplierId": S, "itemId": I, "warehouseId": W, "quantity": 12.5 }` returns `201` `{ id, supplierId: S, itemId: I, warehouseId: W, quantity: 12.5, createdAt }` with UUID `id` and ISO-8601 `createdAt`, no status field; `GET /api/purchases` contains that record; `GET /api/stock` is R; `GET /api/movements` gained no row
Proof: `bun test apps/api/src/services/purchase.service.test.ts --test-name-pattern "C9 create persists UUID id, ISO-8601 createdAt, quantity 12.5, and no status"`
Proof: `bun test apps/api/test/purchases.integration.test.ts --test-name-pattern "C9 POST /api/purchases creates Purchase without writing Stock or Movement"`

**C10** - `POST /api/purchases` with `supplierId`, `itemId` or `warehouseId` equal to `""` or `"   "`, or without quantity, returns `400` `{ "error": "supplierId, itemId, warehouseId, and a positive quantity are required", "statusCode": 400 }`; `GET /api/stock` and `GET /api/purchases` equal the values from before
Proof: `bun test apps/api/src/services/purchase.service.test.ts --test-name-pattern "C10 create with blank ids or missing quantity throws 400 and does not call repository.create"`
Proof: `bun test apps/api/test/purchases.integration.test.ts --test-name-pattern "C10 POST /api/purchases with blank ids or missing quantity returns 400 and persists nothing"`

**C11** - Given S, I and W exist, `POST /api/purchases` with `quantity` `0`, `-1`, `NaN` or `Infinity` returns `400` `{ "error": "quantity must be a positive number", "statusCode": 400 }`
Proof: `bun test apps/api/src/services/purchase.service.test.ts --test-name-pattern "C11 create with quantity 0, -1, NaN or Infinity throws 400 and does not call repository.create"`
Proof: `bun test apps/api/test/purchases.integration.test.ts --test-name-pattern "C11 POST /api/purchases with quantity 0, -1, NaN or Infinity returns 400"`

**C12** - `POST /api/purchases` with non-empty ids whose Supplier, Item or Warehouse does not exist returns `400` `{ "error": "Supplier, Item, or Warehouse not found", "statusCode": 400 }`; nothing is stored
Proof: `bun test apps/api/src/services/purchase.service.test.ts --test-name-pattern "C12 create with a missing Supplier, Item, or Warehouse throws 400 and does not call repository.create"`
Proof: `bun test apps/api/test/purchases.integration.test.ts --test-name-pattern "C12 POST /api/purchases with missing Supplier, Item, or Warehouse returns 400 and persists nothing"`

**C13** - Given a Purchase with no Movement, `DELETE /api/purchases/:id` returns `204` and `GET /api/purchases` does not contain it; `GET /api/stock` is unchanged
Proof: `bun test apps/api/src/services/purchase.service.test.ts --test-name-pattern "C13 deleteById succeeds when the repository deletes the row"`
Proof: `bun test apps/api/test/purchases.integration.test.ts --test-name-pattern "C13 DELETE /api/purchases/:id without Movement returns 204 and leaves Stock unchanged"`

**C14** - Given a Purchase with a Movement, `DELETE /api/purchases/:id` returns `409` `{ "error": "Purchase has Movement", "statusCode": 409 }`; Purchase, Movement and Stock are unchanged
Proof: `bun test apps/api/src/services/purchase.service.test.ts --test-name-pattern "C14 deleteById maps a foreign-key error to 409 Purchase has Movement"`
Proof: `bun test apps/api/test/purchases.integration.test.ts --test-name-pattern "C14 DELETE /api/purchases/:id with Movement returns 409 and keeps Purchase, Movement and Stock"`

**C15** - `DELETE /api/purchases/00000000-0000-4000-8000-000000000000` returns `404` `{ "error": "Purchase not found", "statusCode": 404 }`
Proof: `bun test apps/api/src/services/purchase.service.test.ts --test-name-pattern "C15 deleteById throws 404 when the repository deletes nothing"`
Proof: `bun test apps/api/test/purchases.integration.test.ts --test-name-pattern "C15 DELETE /api/purchases/:id missing id returns 404"`

### S3 - Receipt from Purchase · Movement files 52 KB + schema · ~18k

**C16** - Given Purchase P `{ itemId: I, warehouseId: W, quantity: 12.5 }` with no Movement and Stock of I in W equal to Q (or absent), `POST /api/purchases/P/receipts` with no body returns `201` Movement `{ id, type: "receipt", itemId: I, quantity: 12.5, warehouseId: W, toWarehouseId: null, jobId: null, purchaseId: P, createdAt }` with UUID `id` and ISO-8601 `createdAt`; `GET /api/stock` of I in W is `Q + 12.5` (or `12.5` if absent); `GET /api/movements` contains that row
Proof: `bun test apps/api/src/services/movement.service.test.ts --test-name-pattern "C16 createReceiptFromPurchase persists a receipt Movement with purchaseId and adds 12.5 to Stock"`
Proof: `bun test apps/api/test/purchases.integration.test.ts --test-name-pattern "C16 POST /api/purchases/:id/receipts creates receipt Movement and raises Stock by 12.5"`

**C17** - Given the Purchase from C16 already with a Movement, a second `POST /api/purchases/P/receipts` returns `409` `{ "error": "Purchase already received", "statusCode": 409 }`; `GET /api/movements` still has one row with `purchaseId` P; `GET /api/stock` of I in W equals the post-C16 value. The unique on `movements.purchase_id` is what blocks the second row
Proof: `bun test apps/api/src/services/movement.service.test.ts --test-name-pattern "C17 createReceiptFromPurchase maps a unique-constraint error to 409 Purchase already received"`
Proof: `bun test apps/api/test/purchases.integration.test.ts --test-name-pattern "C17 POST /api/purchases/:id/receipts a second time returns 409 and the unique on purchase_id holds"`

**C18** - `POST /api/purchases/00000000-0000-4000-8000-000000000000/receipts` returns `404` `{ "error": "Purchase not found", "statusCode": 404 }`; `GET /api/stock` and `GET /api/movements` equal the values from before
Proof: `bun test apps/api/src/services/movement.service.test.ts --test-name-pattern "C18 createReceiptFromPurchase throws 404 when the Purchase is missing and does not call apply"`
Proof: `bun test apps/api/test/purchases.integration.test.ts --test-name-pattern "C18 POST /api/purchases/:id/receipts missing Purchase returns 404 and persists nothing"`

**C19** - `POST /api/receipts` `{ warehouseId: W, itemId: I, quantity: 3 }` returns `201`, `body.purchaseId` is `null`, `body.type` is `receipt`; Stock rises by 3. `POST /api/transfers` and `POST /api/issues` keep the same request body and the same status codes
Proof: `bun test apps/api/src/services/movement.service.test.ts --test-name-pattern "C19 createReceipt sets purchaseId null"`
Proof: `bun test apps/api/test/movements.integration.test.ts --test-name-pattern "C19 POST /api/receipts returns purchaseId null and Stock rises by 3"`
Proof: `bun test apps/api/test/movements.integration.test.ts --test-name-pattern "POST /api/transfers moves quantity between Warehouses"`
Proof: `bun test apps/api/test/movements.integration.test.ts --test-name-pattern "POST /api/issues subtracts Stock and leaves Job without quantity"`

### S4 - Procurement screen · App.tsx 30 KB + CONTEXT + ROADMAP · ~8k

**C20** - Given a session and no Supplier, opening Procurement shows `No Supplier yet.`
Proof: Playwright MCP against `http://localhost:5173` — Procurement empty Supplier list reads `No Supplier yet.`

**C21** - Creating a Supplier from the Procurement form shows the persisted name in the list
Proof: Playwright MCP against `http://localhost:5173` — submit Supplier name `Acme`, list contains `Acme`

**C22** - Given Supplier, Item and Warehouse, creating a Purchase on Procurement shows the record and the Stock screen keeps the same quantities
Proof: Playwright MCP against `http://localhost:5173` — create Purchase quantity `12.5`; Procurement lists it; Stock quantities match the snapshot taken before the submit

**C23** - Receiving a Purchase with no Movement adds that quantity on Stock for that Item and Warehouse, and the receive button for that Purchase disappears
Proof: Playwright MCP against `http://localhost:5173` — click receive; Stock shows the added quantity; that Purchase has no receive button

**C24** - Posting a free Receipt on Inventory (Warehouse, Item, quantity) still returns `201`, Stock rises, no Supplier required
Proof: Playwright MCP against `http://localhost:5173` — Inventory Post Receipt with Warehouse, Item, quantity `3`; Stock rises by 3

**C25** - Deleting a Supplier with no Purchase and a Purchase with no Movement removes each from the Procurement list, with no confirmation, same as Job
Proof: Playwright MCP against `http://localhost:5173` — Delete on each row removes it without a dialog

**C26** - An Operator session `POST /api/suppliers`, `POST /api/purchases` and `POST /api/purchases/:id/receipts` with the same valid bodies as Administrator returns the same `201` — no `403`
Proof: `bun test apps/api/test/purchases.integration.test.ts --test-name-pattern "C26 Operator posts Supplier, Purchase, and Receipt from Purchase"`

**C27** - `CONTEXT.md` defines **Supplier** and **Purchase**; Receipt still avoids Purchase as this Movement
Proof: `bun test apps/api/test/procurement-glossary.test.ts --test-name-pattern "C27 CONTEXT.md defines Supplier and Purchase and Receipt avoids Purchase as this Movement"`

## Swept

- validation: C4, C10, C11
- failure modes: C3, C6, C7, C12, C14, C15, C17, C18
- idempotency and retry: C17 — second POST is not 200; unique on `movements.purchase_id` rejects. C3 — retry of create Supplier with the same name is 409, does not add a row
- authorization: C26 — `registerAuth` in `auth.ts` L21-28; no 403
- concurrency and ordering: C17 — the unique on `movements.purchase_id` is also the mechanism for two POSTs on the same Purchase; no distinct product rule
- data lifecycle: C9, C16 — Purchase does not write Stock; `purchase_id` nullable on existing Movement rows (free Receipt/Transfer/Issue). New tables start empty. Unresolved 1 for Item/Warehouse FK
- external-dependency failure: n/a — no I/O beyond local SQLite
- state transitions: C9, C13, C14, C16, C17 — States
- observability: existing — `registerErrorHandler` logs in `error.ts` L17

## Handoff

S1 ~10k + S2 ~11k + S3 ~18k + S4 ~8k = ~47k, under 150k. Surface changes at S4 (`App.tsx`) but the remainder fits, so one batch, no mid-feature handoff.

Proofs run from `apps/api`: `bun test --test-name-pattern "<name>"`. JSON cannot carry `NaN`/`Infinity`; C11 HTTP asserts `0` and `-1`, the unit proof asserts all four.

- Where the boundary fell: S1–S4 closed together; last commit is the feature HEAD.
- What the user settled mid-build: nothing.
- What was abandoned: sending `NaN`/`Infinity` through `fastify.inject` JSON — they arrive as `null` and hit C10.

## Unresolved (do not settle)

1. Deleting an Item or Warehouse that only a Purchase references — FK blocks with `409`; strings stay `Item has Stock` / `Warehouse has Stock`.
2. Human Purchase number — UUID `id`, no order code. C9 uses that shape.
