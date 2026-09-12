# Spec template

Read this when writing or updating `docs/specs/<slug>.md`. Copy the structure. Delete the commentary in italics. Keep ids stable once the user has approved the file (`R1` stays `R1`).

```markdown
# <Feature name>

Status: Draft | Approved
Roadmap: <phase name or "none">

## Goal

<Two sentences. What changes for which actor.>

## Out of scope

- <Explicitly not doing this>

## Assumptions

- <Only if Phase 1 was shortened. Each item becomes an R* or D* after confirmation, then delete this section.>

## Domain rules

- **R1** <Testable invariant. Present tense. No implementation.>
- **R2** <…>

## Scenarios

### S1 — <short name>

Covers: R1

- **Given** <persisted or session state>
- **When** <one action>
- **Then** <observable outcome: HTTP status + body, persisted rows, or UI>

### S2 — <short name>

Covers: R2, R1

- **Given** …
- **When** …
- **Then** …

## HTTP contract

| Method | Path | Auth | Success | Errors |
| --- | --- | --- | --- | --- |
| POST | /api/<resource> | session, Administrator | 201 body | 400, 401, 403, 409 |

Request body:

- `field` — type, required, trim/normalize if any

Response body:

- `field` — type. Never return secrets.

## Technical decisions

- **D1** <choice>. Rejected: <alternative>. Why: <one sentence>.
- **D2** …

## Test obligations

- Service unit: S1, S2, … (every scenario that changes a branch)
- HTTP + real DB: success, 400, 409 unique, 401/403, 404 when listed
- Playwright MCP: <screen flow or "none">

## Likely files

- `apps/api/src/routes/<x>.ts`
- `apps/api/src/services/<x>.service.ts`
- `apps/api/src/services/<x>.service.test.ts`
- `apps/api/src/repositories/<x>.repository.ts`
- `apps/api/test/<x>.integration.test.ts`
```

## Quality bar

A spec is ready for approval only when:

- Rules have no "should", "usually", or "maybe"
- Each rule is cited by at least one scenario
- Each scenario has a single When
- Then clauses are checkable without reading the author's mind
- Unique constraints have both a rule and a 409 scenario
- Authz (who may) has a scenario for the denied role, not only the allowed one
- Decisions do not repeat `AGENTS.md` unless this slice chooses something new

## Shape of a good rule vs a bad one

Bad: "Validate input properly."

Good: **R3** Email is stored trimmed and lowercased. Blank email or password is rejected with 400 and nothing is persisted.

Bad: "Jobs can have items."

Good: **R4** A Job does not hold quantity. Quantity leaves Warehouse Stock through an Issue. This slice does not create Issue.

## Scenario density

Write one scenario per outcome, not one per field. Collapse isomorphic 400s into one scenario that lists the inputs ("blank name, blank SKU, unknown unit"). Keep a separate scenario when the outcome differs (400 vs 409 vs 404).
