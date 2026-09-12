# Procurement Verification

**Verdict**: PASS
**Profile**: light
**Diff range**: 706d211..a067963
**Round**: 1 - full
**Verifier**: independent sub-agent (author != verifier)

Step 1 (binding screens / arrangement) did not run — `ui` only.
Coverage join did not run — `standard`/`ui` only.
Test policy verdicts did not run — `standard`/`ui` only.
Fault injection did not run — `standard`/`ui` only.

Light is thin for a binding screen: it cannot catch a screen nobody built or arrangement vs copy. C20–C25 still ran as Playwright MCP because WAL-2 names them.

## Binding sources

| Source | Opened | Contradiction | Uncovered |
|---|---|---|---|
| `.design/procurement.md` — binding for the interface | yes | step 1 did not run (light) | step 1 did not run (light) |
| WAL-2 Linear | not opened — already extracted into `.checks/procurement.md` | step 1 did not run (light) | step 1 did not run (light) |

## Checks

| Check | Claim | Proof run | Evidence | Result |
|---|---|---|---|---|
| C1 | `GET /api/suppliers` empty → `200` `[]` | batched `bun test --test-name-pattern` exit 0 | `apps/api/test/suppliers.integration.test.ts:59` `expect(response.statusCode).toBe(200)` · `:60` `expect(response.json()).toEqual([])` | PASS |
| C2 | POST trims `"  Acme  "` → `201` `{ id, name: "Acme", createdAt }`; list contains it; purchases `[]`; stock unchanged | batched, both named tests pass | `supplier.service.test.ts:57-59` `created.id` UUID · `created.createdAt` ISO-8601 · `created.name === 'Acme'` · `suppliers.integration.test.ts:71-87` `201` · `body.name === 'Acme'` · list equals `[body]` · purchases `[]` · stock equals before | PASS |
| C3 | duplicate Acme → `409` `{ error: "Supplier already exists", statusCode: 409 }`; one Acme remains | batched, both named tests pass | `supplier.service.test.ts:76-77` `statusCode === 409` · `message === 'Supplier already exists'` · `suppliers.integration.test.ts:103-111` same body · `rows.filter(name === 'Acme')` length `1` | PASS |
| C4 | `name` `""` or `"   "` → `400` `{ error: "name is required", statusCode: 400 }`; repository not called | batched, both named tests pass | `supplier.service.test.ts:42-46` `statusCode === 400` · `message === 'name is required'` · `suppliers.create.notCalled` · `suppliers.integration.test.ts:123-126` same body | PASS |
| C5 | DELETE Supplier with no Purchase → `204`; gone from list | batched, both named tests pass | `supplier.service.test.ts:101` `deleteById.calledOnceWith('supplier-1')` · `suppliers.integration.test.ts:143` `deleted.statusCode === 204` · `:147` `rows.find(id) === undefined` | PASS |
| C6 | DELETE Supplier with Purchase → `409` `{ error: "Supplier has Purchase", statusCode: 409 }`; both remain | batched, both named tests pass | `supplier.service.test.ts:113-114` `409` · `'Supplier has Purchase'` · `suppliers.integration.test.ts:178-191` same body · both ids still present | PASS |
| C7 | DELETE missing UUID → `404` `{ error: "Supplier not found", statusCode: 404 }` | batched, both named tests pass | `supplier.service.test.ts:127-128` `404` · `'Supplier not found'` · `suppliers.integration.test.ts:199-202` same body | PASS |
| C8 | `GET /api/purchases` empty → `200` `[]` | batched | `apps/api/test/purchases.integration.test.ts:78` `statusCode === 200` · `:79` `json() === []` | PASS |
| C9 | POST Purchase `quantity` `12.5` → `201` UUID + ISO-8601, no status; stock and movements unchanged | batched, both named tests pass | `purchase.service.test.ts:37-43` `quantity === 12.5` · `'status' in created === false` · `purchases.integration.test.ts:97-119` `201` · no status · stock equals before · movements equals before | PASS |
| C10 | blank ids or missing quantity → `400` required-fields error; nothing persisted | batched, both named tests pass | `purchase.service.test.ts:68-74` `400` · required-fields message · `create.notCalled` · `purchases.integration.test.ts:139-145` same body · stock and purchases unchanged | PASS |
| C11 | quantity `0`, `-1`, `NaN`, `Infinity` → `400` `{ error: "quantity must be a positive number", statusCode: 400 }` | batched, both named tests pass | Unit `purchase.service.test.ts:79` loops `[0, -1, NaN, Infinity]` · `:88-90` `400` · `'quantity must be a positive number'` · `create.notCalled`. HTTP `purchases.integration.test.ts:151` loops `[0, -1]` only · `:162-165` same body. JSON cannot carry `NaN`/`Infinity` (Handoff); unit covers all four. Precision note, not a reachable-path gap. | PASS |
| C12 | missing Supplier, Item, or Warehouse → `400` `{ error: "Supplier, Item, or Warehouse not found", statusCode: 400 }`; nothing stored | batched, both named tests pass | `purchase.service.test.ts:114-118` `400` · that message · `create.notCalled` · `purchases.integration.test.ts:180-187` same body · purchases `[]` | PASS |
| C13 | DELETE Purchase with no Movement → `204`; gone; stock unchanged | batched, both named tests pass | `purchase.service.test.ts:127` `deleteById.calledOnceWith('purchase-1')` · `purchases.integration.test.ts:206-210` `204` · id absent · stock equals before | PASS |
| C14 | DELETE Purchase with Movement → `409` `{ error: "Purchase has Movement", statusCode: 409 }`; Purchase, Movement, Stock unchanged | batched, both named tests pass | `purchase.service.test.ts:139-140` `409` · `'Purchase has Movement'` · `purchases.integration.test.ts:232-243` same body · purchase remains · movements and stock equal before | PASS |
| C15 | DELETE missing UUID → `404` `{ error: "Purchase not found", statusCode: 404 }` | batched, both named tests pass | `purchase.service.test.ts:153-154` `404` · `'Purchase not found'` · `purchases.integration.test.ts:251-254` same body | PASS |
| C16 | POST receipts → `201` Movement `type: "receipt"` `purchaseId` P `quantity` `12.5`; stock `Q+12.5` | batched, both named tests pass | `movement.service.test.ts:641-650` `type === 'receipt'` · `purchaseId === 'purchase-1'` · apply stock `16.5` · `purchases.integration.test.ts:276-296` `201` · `purchaseId === purchase.id` · stock quantity `12.5` | PASS |
| C17 | second receive → `409` `{ error: "Purchase already received", statusCode: 409 }`; one row; unique index holds | batched, both named tests pass | `movement.service.test.ts:672-673` `409` · `'Purchase already received'` · `purchases.integration.test.ts:324-344` same body · one `purchaseId` row · `movements_purchase_id_unique` `unique === 1` | PASS |
| C18 | missing Purchase receive → `404` `{ error: "Purchase not found", statusCode: 404 }`; apply not called; nothing persisted | batched, both named tests pass | `movement.service.test.ts:686-690` `404` · `'Purchase not found'` · `apply.notCalled` · `purchases.integration.test.ts:355-361` same body · stock and movements unchanged | PASS |
| C19 | free Receipt `purchaseId` `null`, stock +3; transfers and issues keep body and `201` | batched, all four named tests pass | `movement.service.test.ts:612` `created.purchaseId === null` · `movements.integration.test.ts:139-151` `201` · `purchaseId` null · stock `3` · `:260` transfer `201` · `:409` issue `201` (same payloads as before `purchaseId`) | PASS |
| C20 | Procurement with no Supplier shows `No Supplier yet.` | Playwright MCP `http://localhost:5173` after sign-in `admin@local` / `admin` | Procurement heading present; paragraph `No Supplier yet.` | PASS |
| C21 | create Supplier from the form; list shows persisted name | Playwright MCP | submit Name `Acme`; list item `Acme` | PASS |
| C22 | create Purchase; list shows it; Stock quantities unchanged | Playwright MCP | Stock before: `No Stock yet.`; submit quantity `12.5`; list `Acme` / `CEM-50 Cimento CP-II` / `12.5 saco` / `Depot A`; Stock after: `No Stock yet.` | PASS |
| C23 | Receive adds that quantity; Receive button gone | Playwright MCP | click Receive; button gone on that row; Stock `Depot A` / `CEM-50 Cimento CP-II` / `12.5 saco` | PASS |
| C24 | Inventory free Receipt (Warehouse, Item, quantity) raises Stock; no Supplier | Playwright MCP | Receipt form has Warehouse, Item, Quantity — no Supplier; Post Receipt `3`; Inventory lists `3 saco`; Stock `15.5 saco` (was `12.5`) | PASS |
| C25 | Delete Supplier with no Purchase and Purchase with no Movement; no confirm | Playwright MCP | Delete `Bulk Co` — gone, no dialog; Delete `1 saco` Purchase — gone, no dialog; received `12.5` row remains | PASS |
| C26 | Operator POST suppliers, purchases, receipts → `201`; no `403` | batched | `purchases.integration.test.ts:388` supplier `201` · `:401` purchase `201` · `:408` receipt `201` | PASS |
| C27 | `CONTEXT.md` defines Supplier and Purchase; Receipt avoids Purchase as this Movement | batched | `procurement-glossary.test.ts:9-11` `toContain('**Supplier**:')` · `toContain('**Purchase**:')` · `toMatch(/\*\*Receipt\*\*:[\s\S]*Purchase \(as this Movement\)/)`. Matches `CONTEXT.md:47`, `:51`, `:57`. | PASS |

## Test policy rows

Did not run — `standard`/`ui` only.

## Faults injected

Did not run — `standard`/`ui` only.

## Swept existing

- `registerAuth` is in `apps/api/src/middleware/auth.ts:20-28` — `preHandler` throws `401` `Unauthorized` when `request.session.userId` is missing. No `403`.
- `registerErrorHandler` is in `apps/api/src/middleware/error.ts:15-24` and logs at `:17` (`fastify.log.error(error)`).

## C11 precision

HTTP cannot send `NaN`/`Infinity` through JSON (`null` would hit C10). The named HTTP proof loops `[0, -1]` only; the unit proof loops all four and asserts `'quantity must be a positive number'`. Under light this is a named-vs-reachable sampling mismatch, not an untested path. Not a FAIL.

## Gate

`bun test --test-name-pattern "<C1–C19, C26, C27 and C19 transfer/issue names>"` from `apps/api` — 40 passed, 0 failed, 144 filtered out.

Playwright MCP C20–C25 against `http://localhost:5173` with API `http://localhost:3000` on `/tmp/fake-erp-wal2-verify.sqlite`.
