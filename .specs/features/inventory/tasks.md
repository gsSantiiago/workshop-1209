# Inventory Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/inventory/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Service | unit | Every branch that changes the outcome; `sinon.createStubInstance` of the repository; no IO | `apps/api/src/services/*.service.test.ts` | `bun test apps/api/src/services` |
| Route + DB | integration | HTTP contract for the new paths (`200 []`, `201`, `400`, `401`, `409`, `404`) plus unique/FK behavior | `apps/api/test/*.integration.test.ts` | `bun test apps/api` |
| Repository | none | AGENTS: repository alone proves nothing | - | build gate only |
| Schema / SQL | none | Build + integration that inspects columns when the spec requires it | `apps/api/src/db/schema.ts` | build gate only |
| Docs / glossary / roadmap | none | - | `CONTEXT.md`, `ROADMAP.md` | build gate only |
| Container / route register | none | Proven when the integration suite boots `createServer()` | `apps/api/src/container/*`, `apps/api/src/server.ts` | build gate only |
| Web | none in git | Playwright MCP at end of the screen change; no Playwright files in git | `apps/web/src/App.tsx` | Playwright MCP |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After service unit tasks | `bun test apps/api/src/services` |
| Full | After HTTP or integration tasks | `bun test apps/api` |
| Build | After schema, wiring, docs, or UI tasks | `bun test apps/api && bun --filter @fake-erp/web lint` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Foundation

```
T1 -> T2 -> T3 -> T4
```

### Phase 2: Service

```
T5 -> T6 -> T7 -> T8
```

### Phase 3: HTTP

```
T9 -> T10 -> T11 -> T12 -> T13
```

### Phase 4: Stock contract

```
T14 -> T15 -> T16
```

### Phase 5: Screen

```
T17 -> T18
```

---

## Task Breakdown

### Phase 1: Foundation

### T1: Add Inventory terms to CONTEXT.md

**What**: Add Movement, Receipt, Transfer, and Issue to the glossary in English.
**Where**: `CONTEXT.md`
**Depends on**: None
**Reuses**: Existing glossary voice in `CONTEXT.md`
**Requirement**: INV-35

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] CONTEXT defines Movement, Receipt, Transfer, Issue
- [x] Avoid lists reject Portuguese synonyms and reject Job as a quantity place
- [x] Gate check passes: `bun test apps/api && bun --filter @fake-erp/web lint`

**Tests**: none
**Gate**: build

---

### T2: Add movements table to schema

**What**: Declare the `movements` table on the Drizzle schema.
**Where**: `apps/api/src/db/schema.ts`
**Depends on**: T1
**Reuses**: `stock` FK + unique style in the same file
**Requirement**: INV-01, INV-11, INV-21

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Columns match design: `id`, `type`, `item_id`, `quantity`, `warehouse_id`, `to_warehouse_id`, `job_id`, `created_at`
- [x] FKs point at items, warehouses, jobs
- [x] Gate check passes: `bun test apps/api && bun --filter @fake-erp/web lint`

**Tests**: none
**Gate**: build

---

### T3: Apply movements DDL

**What**: Create the `movements` table in `applySchema`.
**Where**: `apps/api/src/db/apply-schema.ts`
**Depends on**: T2
**Reuses**: Existing `CREATE TABLE IF NOT EXISTS` blocks in the same file
**Requirement**: INV-01, INV-11, INV-21

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] SQL columns and FKs match T2
- [x] Gate check passes: `bun test apps/api && bun --filter @fake-erp/web lint`

**Tests**: none
**Gate**: build

---

### T4: Create MovementRepository

**What**: Add `list`, `findStock`, and `apply` (transactional insert Movement + upsert Stock).
**Where**: `apps/api/src/repositories/movement.repository.ts`
**Depends on**: T3
**Reuses**: `apps/api/src/repositories/stock.repository.ts` row mapping; Drizzle `db.transaction`
**Requirement**: INV-19

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `apply` writes Movement and Stock deltas inside one `db.transaction`
- [x] `findStock` returns the Warehouse+Item row or null
- [x] Gate check passes: `bun test apps/api && bun --filter @fake-erp/web lint`

**Tests**: none
**Gate**: build

---

### Phase 2: Service

### T5: Implement createReceipt and list

**What**: MovementService `list` and `createReceipt` with unit tests for every Receipt branch.
**Where**: `apps/api/src/services/movement.service.ts`
**Depends on**: T4
**Reuses**: `apps/api/src/services/stock.service.ts` `httpError` and FK mapping; `sinon.createStubInstance(MovementRepository)`
**Requirement**: INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, INV-07

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `createReceipt` persists via `apply` with type `receipt`
- [x] Blank ids → 400 spec message; bad quantity → 400; FK → 400 `Warehouse or Item not found`
- [x] Missing Stock → insert qty; existing Stock → add qty
- [x] Unit tests stub the repository; no `new MovementRepository`
- [x] Gate check passes: `bun test apps/api/src/services`
- [x] Test count: 7+ Receipt/list tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T6: Implement createTransfer

**What**: MovementService `createTransfer` with unit tests for every Transfer branch.
**Where**: `apps/api/src/services/movement.service.ts`
**Depends on**: T5
**Reuses**: T5 validation helpers
**Requirement**: INV-11, INV-12, INV-13, INV-14, INV-15, INV-16, INV-17, INV-18, INV-19

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Success subtracts source and adds dest (create dest when missing)
- [x] Insufficient or missing source → 400 `Insufficient Stock`; `apply` not called
- [x] Same Warehouse → 400 spec message; `apply` not called
- [x] Blank ids / bad quantity / FK match spec messages
- [x] Gate check passes: `bun test apps/api/src/services`
- [x] Test count: 8+ Transfer tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T7: Implement createIssue

**What**: MovementService `createIssue` with unit tests for every Issue branch.
**Where**: `apps/api/src/services/movement.service.ts`
**Depends on**: T6
**Reuses**: T5/T6 validation helpers
**Requirement**: INV-21, INV-22, INV-23, INV-24, INV-25, INV-26, INV-27, INV-28

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Success subtracts source; quantity `0` still calls `apply` with `0`
- [x] Insufficient → 400 `Insufficient Stock`; `apply` not called
- [x] Missing Job FK → 400 `Job not found`
- [x] Blank ids / bad quantity / missing Warehouse or Item match spec
- [x] Gate check passes: `bun test apps/api/src/services`
- [x] Test count: 6+ Issue tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T8: Reject Job delete when it has a Movement

**What**: JobService `deleteById` returns 409 `Job has Movement` when an Issue exists.
**Where**: `apps/api/src/services/job.service.ts`
**Depends on**: T7
**Reuses**: Warehouse-has-Stock 409 style
**Requirement**: INV-30

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Unit test: the delete branch yields 409 `Job has Movement`
- [x] Gate check passes: `bun test apps/api/src/services`
- [x] Test count: Job unit suite plus the new branch pass

**Tests**: unit
**Gate**: quick

---

### Phase 3: HTTP

### T9: Add Movement DI tokens

**What**: Add `movementRepository` and `movementService` tokens.
**Where**: `apps/api/src/container/container.ts`
**Depends on**: T8
**Reuses**: Existing `tokens` object
**Requirement**: INV-01

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Tokens exist and the file still typechecks
- [x] Gate check passes: `bun test apps/api && bun --filter @fake-erp/web lint`

**Tests**: none
**Gate**: build

---

### T10: Register Movement in the container

**What**: Register MovementRepository and MovementService.
**Where**: `apps/api/src/container/service-registration.ts`
**Depends on**: T9
**Reuses**: Job registration block in the same file
**Requirement**: INV-01

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] MovementService is constructed with MovementRepository
- [x] Gate check passes: `bun test apps/api && bun --filter @fake-erp/web lint`

**Tests**: none
**Gate**: build

---

### T11: Add Movement routes

**What**: GET `/api/movements` and POST `/api/receipts`, `/api/transfers`, `/api/issues`.
**Where**: `apps/api/src/routes/movements.ts`
**Depends on**: T10
**Reuses**: `apps/api/src/routes/jobs.ts`
**Requirement**: INV-01, INV-07, INV-11, INV-21, INV-34

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Four handlers call the service and return 200/201 as designed
- [x] No DELETE or PATCH
- [x] Gate check passes: `bun test apps/api && bun --filter @fake-erp/web lint`

**Tests**: none
**Gate**: build

---

### T12: Register Movement routes on the server

**What**: `createServer` registers `movementRoutes`.
**Where**: `apps/api/src/server.ts`
**Depends on**: T11
**Reuses**: `jobRoutes` registration in the same file
**Requirement**: INV-01

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `movementRoutes` is registered
- [ ] Gate check passes: `bun test apps/api && bun --filter @fake-erp/web lint`

**Tests**: none
**Gate**: build

---

### T13: Add Movements HTTP integration tests

**What**: Prove the HTTP contract for Receipt, Transfer, Issue, list, 401, Operator, and Job-delete 409.
**Where**: `apps/api/test/movements.integration.test.ts`
**Depends on**: T12
**Reuses**: `apps/api/test/jobs.integration.test.ts`, `apps/api/test/login.ts`
**Requirement**: INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, INV-07, INV-08, INV-09, INV-10, INV-11, INV-12, INV-13, INV-14, INV-15, INV-16, INV-17, INV-18, INV-20, INV-21, INV-22, INV-23, INV-24, INV-25, INV-26, INV-27, INV-28, INV-29, INV-30

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Empty list `200 []`; each POST `201`; validation `400` with spec messages
- [ ] Insufficient Transfer/Issue leaves Stock unchanged
- [ ] Transfer equal to source leaves source at `0`; Issue to `0` keeps the row
- [ ] Unauthenticated POST is `401`; Operator can post all three
- [ ] DELETE Job after Issue is `409` `Job has Movement`
- [ ] `container.clear()` before `createServer()`
- [ ] Gate check passes: `bun test apps/api`
- [ ] Test count: 20+ integration tests pass (no silent deletions)

**Tests**: integration
**Gate**: full

---

### Phase 4: Stock contract

### T14: Remove StockService create and delete

**What**: StockService keeps `list` only; drop create/delete unit tests that asserted the old writer.
**Where**: `apps/api/src/services/stock.service.ts`
**Depends on**: T13
**Reuses**: Remaining `list` test in `stock.service.test.ts`
**Requirement**: INV-31, INV-32, INV-33

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `create` and `deleteById` are gone
- [ ] Create/delete unit tests are gone (this is the contract change, not a silent deletion)
- [ ] `list` unit test still passes
- [ ] Gate check passes: `bun test apps/api/src/services`
- [ ] Test count: remaining Stock unit tests pass

**Tests**: unit
**Gate**: quick

---

### T15: Remove POST and DELETE Stock routes

**What**: `stockRoutes` exposes GET `/api/stock` only.
**Where**: `apps/api/src/routes/stock.ts`
**Depends on**: T14
**Reuses**: GET handler already in the file
**Requirement**: INV-32, INV-33

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] POST and DELETE handlers are gone
- [ ] Gate check passes: `bun test apps/api && bun --filter @fake-erp/web lint`

**Tests**: none
**Gate**: build

---

### T16: Rewrite warehouse-stock integration for Receipt

**What**: Seed Stock via Receipt; assert POST/DELETE `/api/stock` are 404; keep Warehouse/Item delete 409.
**Where**: `apps/api/test/warehouse-stock.integration.test.ts`
**Depends on**: T15
**Reuses**: T13 Receipt POST
**Requirement**: INV-08, INV-31, INV-32, INV-33

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] No test POSTs `/api/stock` expecting 201
- [ ] POST `/api/stock` and DELETE `/api/stock/:id` assert 404
- [ ] GET `/api/stock` still lists balances created by Receipt
- [ ] DELETE Warehouse/Item with Stock still 409
- [ ] Gate check passes: `bun test apps/api`
- [ ] Test count: suite stays green (no silent deletions of warehouse cases)

**Tests**: integration
**Gate**: full

---

### Phase 5: Screen

### T17: Add Inventory screen and make Stock read-only

**What**: Nav + Inventory forms and Movement list; remove Stock create form and delete button.
**Where**: `apps/web/src/App.tsx`
**Depends on**: T16
**Reuses**: Job and Stock screen blocks in the same file
**Requirement**: INV-35, INV-36, INV-37, INV-38, INV-39

**Tools**:

- MCP: `user-playwright`
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Inventory posts Receipt, Transfer, Issue and lists Movements
- [ ] Stock screen shows balances only
- [ ] Playwright MCP on `http://localhost:5173` exercises Receipt → Transfer → Issue, then Stock and Job (not a first-paint screenshot)
- [ ] Gate check passes: `bun test apps/api && bun --filter @fake-erp/web lint`
- [ ] No Playwright files added to git

**Tests**: none
**Gate**: build

---

### T18: Mark Inventory done on the roadmap

**What**: Move Inventory to Done in ROADMAP.md.
**Where**: `ROADMAP.md`
**Depends on**: T17
**Reuses**: Job Done entry style
**Requirement**: INV-35

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Phase 4 Inventory is listed under Done
- [ ] Gate check passes: `bun test apps/api && bun --filter @fake-erp/web lint`

**Tests**: none
**Gate**: build

---

## Phase Execution Map

```
Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5

Phase 1:  T1 -> T2 -> T3 -> T4
Phase 2:  T5 -> T6 -> T7 -> T8
Phase 3:  T9 -> T10 -> T11 -> T12 -> T13
Phase 4:  T14 -> T15 -> T16
Phase 5:  T17 -> T18
```

Execution is strictly sequential. 18 tasks pack into three batches of whole phases (4+4, 5, 3+2). Execute offers sub-agents; do not auto-spawn.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: CONTEXT glossary | 1 file | Granular |
| T2: schema movements | 1 file | Granular |
| T3: apply-schema DDL | 1 file | Granular |
| T4: MovementRepository | 1 file | Granular |
| T5: createReceipt + tests | 1 service | Granular |
| T6: createTransfer + tests | 1 function | Granular |
| T7: createIssue + tests | 1 function | Granular |
| T8: Job delete 409 | 1 function | Granular |
| T9: DI tokens | 1 file | Granular |
| T10: service-registration | 1 file | Granular |
| T11: movement routes | 1 file | Granular |
| T12: server register | 1 file | Granular |
| T13: movements integration | 1 file | Granular |
| T14: StockService strip | 1 service | Granular |
| T15: stock routes strip | 1 file | Granular |
| T16: warehouse-stock tests | 1 file | Granular |
| T17: Inventory + Stock UI | 1 file | Granular |
| T18: ROADMAP | 1 file | Granular |

**Granularity check**: each task is one file or one function. T5/T6/T7 colocate unit tests per AGENTS. T17 is one screen file on purpose.

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | (phase start) | Match |
| T2 | T1 | T1 -> T2 | Match |
| T3 | T2 | T2 -> T3 | Match |
| T4 | T3 | T3 -> T4 | Match |
| T5 | T4 | (cross-phase, no intra arrow) | Match |
| T6 | T5 | T5 -> T6 | Match |
| T7 | T6 | T6 -> T7 | Match |
| T8 | T7 | T7 -> T8 | Match |
| T9 | T8 | (cross-phase) | Match |
| T10 | T9 | T9 -> T10 | Match |
| T11 | T10 | T10 -> T11 | Match |
| T12 | T11 | T11 -> T12 | Match |
| T13 | T12 | T12 -> T13 | Match |
| T14 | T13 | (cross-phase) | Match |
| T15 | T14 | T14 -> T15 | Match |
| T16 | T15 | T15 -> T16 | Match |
| T17 | T16 | (cross-phase) | Match |
| T18 | T17 | T17 -> T18 | Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Docs | none | none | OK |
| T2 | Schema | none | none | OK |
| T3 | Schema / SQL | none | none | OK |
| T4 | Repository | none | none | OK |
| T5 | Service | unit | unit | OK |
| T6 | Service | unit | unit | OK |
| T7 | Service | unit | unit | OK |
| T8 | Service | unit | unit | OK |
| T9 | Container | none | none | OK |
| T10 | Container | none | none | OK |
| T11 | Route register | none | none | OK |
| T12 | Route register | none | none | OK |
| T13 | Route + DB | integration | integration | OK |
| T14 | Service | unit | unit | OK |
| T15 | Route register | none | none | OK |
| T16 | Route + DB | integration | integration | OK |
| T17 | Web | none in git | none | OK |
| T18 | Docs | none | none | OK |

T11/T12 stay untested alone; T13 is the merge-forward integration for those routes. INV-30 unit is T8; INV-30 HTTP is T13.
