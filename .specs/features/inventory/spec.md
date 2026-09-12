# Inventory Specification

## Problem Statement

Stock quantity is created and deleted by hand. The classroom loop needs quantity to enter a Warehouse (Receipt), move between Warehouses (Transfer), and leave a Warehouse for a Job (Issue). Without those Movements, Stock is a fake balance and Issue cannot exist.

## Goals

- [ ] A signed-in User can post Receipt, Transfer, and Issue and see Stock quantity change
- [ ] Stock is no longer writable through `POST /api/stock` or `DELETE /api/stock`
- [ ] Job still has no quantity after an Issue

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Purchase / Supplier | Phase 5 Procurement |
| Reverse or delete of a Movement | Not in the discussed slice |
| Quantity on a Job | CONTEXT and Job spec already forbid it |
| Role 403 | This slice keeps session-only writes |
| Staff, Assignment, Requisition | Later phases |
| Client idempotency key | Classroom, single actor |
| Rate limits, metrics, TTL | Classroom; remaining dimensions N/A |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Who writes Stock quantity | Only Receipt, Transfer, Issue | Roadmap is movements that change Stock; `POST /api/stock` would bypass Receipt | y |
| `POST /api/stock` and `DELETE /api/stock` | Removed | Same writer rule; delete would erase a balance without a Movement | y |
| Who posts a Movement | Any signed-in User | Matches Job and current Stock; 403 is not this slice | y |
| Missing Stock on Receipt or inbound Transfer | Create the Stock row | Movements-only has no other way to open a balance | y |
| Insufficient source quantity | 400 `Insufficient Stock`; no Movement; Stock unchanged | Stock must not go negative | y |
| Issue destination | Job is the reason; quantity leaves the Warehouse | CONTEXT: Job does not hold quantity | y |
| Quantity 0 after Issue | Keep the Stock row | Discussed; delete of Stock is gone | y |
| Transfer same Warehouse | 400 `fromWarehouseId and toWarehouseId must differ` | Not a movement | y |
| Movement quantity bound | Finite number greater than 0 | Zero would be a no-op; negative is a reverse | y |
| Screen | New Inventory screen with three forms and a Movement list; Stock is balances only | Discussed | y |
| Transfer atomicity | One SQLite transaction reads source quantity and writes Movement plus both Stock rows | Partial Transfer would lie about Stock | y |
| Idempotency | Each POST is a new Movement; no client key | Classroom; declined as a gray area | y |
| Observability / rate limits / expiry | N/A | Classroom slice; no ops surface | y |
| Concurrent Movements | Read and write Stock inside the same transaction | SQLite classroom; no extra lock API | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Receipt ⭐ MVP

**User Story**: As a signed-in User, I want to post a Receipt so that quantity of an Item enters a Warehouse.

**Why P1**: Without inbound quantity, Transfer and Issue have nothing to move.

**Acceptance Criteria**:

1. WHEN a signed-in User POSTs `/api/receipts` with a valid `warehouseId`, `itemId`, and quantity `12.5` THEN the system SHALL persist a Movement with `type` `receipt`, those fields, a UUID `id`, and an ISO-8601 `createdAt`, and SHALL respond `201` with that record
2. WHEN a Receipt is posted for a Warehouse and Item with no Stock row THEN the system SHALL create Stock with quantity `12.5`
3. WHEN a Receipt is posted for a Warehouse and Item whose Stock quantity is `4` THEN the system SHALL set that Stock quantity to `16.5`
4. IF `quantity` is missing, not a finite number, or is less than or equal to `0` THEN the system SHALL respond `400` `{ "error": "quantity must be a positive number", "statusCode": 400 }` and SHALL persist no Movement and no Stock change
5. IF `warehouseId` or `itemId` is blank or whitespace THEN the system SHALL respond `400` `{ "error": "warehouseId, itemId, and a positive quantity are required", "statusCode": 400 }` and SHALL persist no Movement
6. IF the Warehouse or Item does not exist THEN the system SHALL respond `400` `{ "error": "Warehouse or Item not found", "statusCode": 400 }` and SHALL persist no Movement
7. WHEN GET `/api/movements` after that Receipt THEN the system SHALL respond `200` with a list that contains the persisted Movement
8. WHEN GET `/api/stock` after that Receipt THEN the system SHALL include the Stock row with the new quantity
9. WHEN POST `/api/receipts` has no session THEN the system SHALL respond `401` `{ "error": "Unauthorized", "statusCode": 401 }`
10. WHEN a signed-in Operator POSTs a valid Receipt THEN the system SHALL persist it and respond `201`

**Independent Test**: POST a Receipt, GET `/api/movements` and GET `/api/stock`, confirm quantity landed.

---

### P1: Transfer ⭐ MVP

**User Story**: As a signed-in User, I want to Transfer quantity from one Warehouse to another so that Stock follows the goods.

**Why P1**: The roadmap names Transfer as a Movement that changes Stock.

**Acceptance Criteria**:

1. WHEN a signed-in User POSTs `/api/transfers` with valid `fromWarehouseId`, `toWarehouseId`, `itemId`, and quantity `3` THEN the system SHALL persist a Movement with `type` `transfer` and SHALL respond `201` with that record
2. WHEN that Transfer succeeds and destination Stock already exists THEN the system SHALL subtract `3` from source Stock and add `3` to destination Stock
3. WHEN that Transfer succeeds and destination Stock does not exist THEN the system SHALL create destination Stock with quantity `3` and subtract `3` from source Stock
4. IF source Stock is missing or its quantity is less than the Transfer quantity THEN the system SHALL respond `400` `{ "error": "Insufficient Stock", "statusCode": 400 }` and SHALL persist no Movement and SHALL leave every Stock row unchanged
5. IF `fromWarehouseId` equals `toWarehouseId` THEN the system SHALL respond `400` `{ "error": "fromWarehouseId and toWarehouseId must differ", "statusCode": 400 }` and SHALL persist no Movement
6. IF `fromWarehouseId`, `toWarehouseId`, or `itemId` is blank or whitespace THEN the system SHALL respond `400` `{ "error": "fromWarehouseId, toWarehouseId, itemId, and a positive quantity are required", "statusCode": 400 }` and SHALL persist no Movement
7. IF `quantity` is missing, not a finite number, or is less than or equal to `0` THEN the system SHALL respond `400` `{ "error": "quantity must be a positive number", "statusCode": 400 }` and SHALL persist no Movement
8. IF a Warehouse or Item does not exist THEN the system SHALL respond `400` `{ "error": "Warehouse or Item not found", "statusCode": 400 }` and SHALL persist no Movement
9. WHEN applying a Transfer THEN the system SHALL read source quantity and write the Movement and both Stock rows in one SQLite transaction
10. WHEN a signed-in Operator POSTs a valid Transfer THEN the system SHALL persist it and respond `201`

**Independent Test**: Receipt into Warehouse A, Transfer to Warehouse B, GET `/api/stock` shows both balances.

---

### P1: Issue ⭐ MVP

**User Story**: As a signed-in User, I want to Issue quantity from a Warehouse to a Job so that Stock leaves the depot without becoming a Job balance.

**Why P1**: The closed loop ends when quantity is issued to a Job.

**Acceptance Criteria**:

1. WHEN a signed-in User POSTs `/api/issues` with valid `warehouseId`, `itemId`, `jobId`, and quantity `2` THEN the system SHALL persist a Movement with `type` `issue` and those fields, SHALL respond `201` with that record, and SHALL leave the Job record without a `quantity` field
2. WHEN that Issue succeeds THEN the system SHALL subtract `2` from the source Stock quantity
3. WHEN an Issue reduces source Stock to `0` THEN the system SHALL keep that Stock row with quantity `0`
4. IF source Stock is missing or its quantity is less than the Issue quantity THEN the system SHALL respond `400` `{ "error": "Insufficient Stock", "statusCode": 400 }` and SHALL persist no Movement and SHALL leave Stock unchanged
5. IF `warehouseId`, `itemId`, or `jobId` is blank or whitespace THEN the system SHALL respond `400` `{ "error": "warehouseId, itemId, jobId, and a positive quantity are required", "statusCode": 400 }` and SHALL persist no Movement
6. IF `quantity` is missing, not a finite number, or is less than or equal to `0` THEN the system SHALL respond `400` `{ "error": "quantity must be a positive number", "statusCode": 400 }` and SHALL persist no Movement
7. IF the Warehouse or Item does not exist THEN the system SHALL respond `400` `{ "error": "Warehouse or Item not found", "statusCode": 400 }` and SHALL persist no Movement
8. IF the Job does not exist THEN the system SHALL respond `400` `{ "error": "Job not found", "statusCode": 400 }` and SHALL persist no Movement
9. WHEN a signed-in Operator POSTs a valid Issue THEN the system SHALL persist it and respond `201`
10. IF a signed-in User DELETEs a Job that has an Issue THEN the system SHALL respond `409` `{ "error": "Job has Movement", "statusCode": 409 }` and SHALL leave the Job and the Movement in place

**Independent Test**: Receipt, Issue to a Job, GET `/api/stock` dropped, GET `/api/jobs` still has no `quantity`.

---

### P1: Stock is a balance view ⭐ MVP

**User Story**: As a signed-in User, I want Stock to show current quantity only so that I cannot invent or erase a balance.

**Why P1**: The writer rule is the contract change of this slice.

**Acceptance Criteria**:

1. WHEN a signed-in User GETs `/api/stock` THEN the system SHALL respond `200` with the current Stock array
2. WHEN a signed-in User POSTs `/api/stock` THEN the system SHALL respond `404` and SHALL persist no Stock row
3. WHEN a signed-in User DELETEs `/api/stock/:id` THEN the system SHALL respond `404` and SHALL leave Stock unchanged
4. The system SHALL not expose a Movement delete or update endpoint

**Independent Test**: GET `/api/stock` still lists balances; POST and DELETE `/api/stock` are 404.

---

### P1: Inventory screen ⭐ MVP

**User Story**: As a signed-in User, I want an Inventory screen so that I can post the three Movements and see them listed.

**Why P1**: A change that touches a screen is unfinished until the flow is exercised.

**Acceptance Criteria**:

1. WHEN a signed-in User opens Inventory THEN the system SHALL show forms for Receipt, Transfer, and Issue and a list of Movements
2. WHEN they submit a valid Receipt THEN the Movement list SHALL show that Receipt and the Stock screen SHALL show the new quantity
3. WHEN they submit a valid Transfer THEN the Stock screen SHALL show the source quantity decreased and the destination quantity increased
4. WHEN they submit a valid Issue THEN the Stock screen SHALL show the source quantity decreased and the Job screen SHALL still show no quantity
5. WHILE the User is on the Stock screen the system SHALL not show a create-Stock form or a delete-Stock action

**Independent Test**: Playwright MCP on `http://localhost:5173`: Receipt, Transfer, Issue, then Stock and Job screens.

---

## Edge Cases

- IF Transfer quantity equals source Stock exactly THEN the system SHALL succeed and leave source Stock at `0`
- IF two Receipts target the same Warehouse and Item THEN the system SHALL add both quantities to the same Stock row
- IF GET `/api/movements` has no rows THEN the system SHALL respond `200` and `[]`

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| INV-01 | P1: Receipt persist 201 | T5, T13 | In Tasks |
| INV-02 | P1: Receipt creates Stock | T5, T13 | In Tasks |
| INV-03 | P1: Receipt adds to Stock | T5, T13 | In Tasks |
| INV-04 | P1: Receipt bad quantity | T5, T13 | In Tasks |
| INV-05 | P1: Receipt blank ids | T5, T13 | In Tasks |
| INV-06 | P1: Receipt missing refs | T5, T13 | In Tasks |
| INV-07 | P1: List contains Receipt | T5, T13 | In Tasks |
| INV-08 | P1: GET Stock after Receipt | T13, T16 | In Tasks |
| INV-09 | P1: Receipt 401 | T13 | In Tasks |
| INV-10 | P1: Operator Receipt | T13 | In Tasks |
| INV-11 | P1: Transfer persist 201 | T6, T13 | In Tasks |
| INV-12 | P1: Transfer both Stocks | T6, T13 | In Tasks |
| INV-13 | P1: Transfer creates dest | T6, T13 | In Tasks |
| INV-14 | P1: Transfer insufficient | T6, T13 | In Tasks |
| INV-15 | P1: Transfer same Warehouse | T6, T13 | In Tasks |
| INV-16 | P1: Transfer blank ids | T6, T13 | In Tasks |
| INV-17 | P1: Transfer bad quantity | T6, T13 | In Tasks |
| INV-18 | P1: Transfer missing refs | T6, T13 | In Tasks |
| INV-19 | P1: Transfer transaction | T4, T6 | In Tasks |
| INV-20 | P1: Operator Transfer | T13 | In Tasks |
| INV-21 | P1: Issue persist 201 | T7, T13 | In Tasks |
| INV-22 | P1: Issue subtracts Stock | T7, T13 | In Tasks |
| INV-23 | P1: Issue keeps zero | T7, T13 | In Tasks |
| INV-24 | P1: Issue insufficient | T7, T13 | In Tasks |
| INV-25 | P1: Issue blank ids | T7, T13 | In Tasks |
| INV-26 | P1: Issue bad quantity | T7, T13 | In Tasks |
| INV-27 | P1: Issue missing Warehouse/Item | T7, T13 | In Tasks |
| INV-28 | P1: Issue missing Job | T7, T13 | In Tasks |
| INV-29 | P1: Operator Issue | T13 | In Tasks |
| INV-30 | P1: Job delete with Issue | T8, T13 | In Tasks |
| INV-31 | P1: GET Stock | T14, T16 | In Tasks |
| INV-32 | P1: POST Stock 404 | T14, T15, T16 | In Tasks |
| INV-33 | P1: DELETE Stock 404 | T14, T15, T16 | In Tasks |
| INV-34 | P1: No Movement delete | T11 | In Tasks |
| INV-35 | P1: Inventory screen forms | T1, T17 | Implementing |
| INV-36 | P1: Screen Receipt | T17 | In Tasks |
| INV-37 | P1: Screen Transfer | T17 | In Tasks |
| INV-38 | P1: Screen Issue | T17 | In Tasks |
| INV-39 | P1: Stock screen read-only | T17 | In Tasks |

**ID format:** `INV-NN`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 39 total, 39 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Receipt, Transfer, and Issue each change Stock as specified
- [ ] `POST /api/stock` and `DELETE /api/stock` are 404
- [ ] Job has no quantity after Issue
- [ ] Inventory screen posts all three Movements; Stock screen cannot create or delete
