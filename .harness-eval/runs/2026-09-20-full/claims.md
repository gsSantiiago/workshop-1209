# Blind claim deck — run `2026-09-20-full`

> Score every row. Some rows may be synthetic calibration rows.
> Do NOT read trap-key.json, claims.jsonl, Judge1 scores, or prior agreement reports.
> README is out of harness scope — do not cite it as rediscovery evidence.

## Rubric

| Cost | Meaning |
|------|---------|
| 0 | Exact string in a discovered manifest/config |
| 1 | Obvious from one directory listing or one file header |
| 2 | Needs reading implementation across modules |
| 3 | Runtime failure, environment-specific, or process/policy |

Classes: REDUNDANT-CODE | REDUNDANT-GENERAL | KEEP-POLICY | KEEP-CAVEAT | KEEP-ROUTING | KEEP-COMPRESSED | UNCLEAR

**Hard rule:** cost ≥ 2 → never REDUNDANT-*. Default UNCLEAR/KEEP when unsure.

## Claims

| ID | Tier | Source | Quote |
|----|------|--------|-------|
| C001 | T0 | `AGENTS.md` | Classroom ERP. Language lives in `CONTEXT.md`. Domain terms are English — in `CONTEXT.md`, code, and UI. No Portuguese synonyms. Do not reopen what is already decided. |
| C002 | T0 | `AGENTS.md` | Request path: `routes/` → `services/` → `repositories/`, same level. The next resource copies that trio. |
| C003 | T0 | `AGENTS.md` | DI: homemade container, concrete classes. The service takes the repository class. Unit tests stub it with `sinon.createStubInstance`. |
| C004 | T0 | `AGENTS.md` | HTTP: domain under `/api/...`. Health is `GET /health`. Errors: throw `Error` with `statusCode`; the middleware responds `{ error, statusCode }`. No error class hierarchy. |
| C005 | T0 | `AGENTS.md` | `bun:test` on the API. Obligations add up: a green integration test does not replace the service suite. |
| C006 | T0 | `AGENTS.md` | Unit stub: `sinon.createStubInstance(ItemRepository)` — then `items.create.resolves()` / `.rejects(err)`; assert `calledOnce`, `notCalled`, `firstCall.args`. Never `new ItemRepository` in the service suite. |
| C007 | T0 | `AGENTS.md` | Unique SKU: the service maps a SQLite unique violation to `409` (unit, stub rejects with that error). The unique _index_ is proven by integration. The service does not `findBySku`. |
| C008 | T0 | `AGENTS.md` | `container.clear()` before a second `createServer()`. Without it: `Already registered`. |
| C009 | T0 | `AGENTS.md` | Use the team Wald-test for backlog for this project, always follow the tlc-plan task format |
| C010 | T0 | `AGENTS.md` | A change that touches a screen (UI, layout, styling, routing, client state, rendered data) is unfinished until Playwright has exercised the flow. Use the Playwright MCP against the running web app (`http://localhost:5173`). Click, type, submit, navigate — a first-paint screenshot does not count. Related routes that share the same state must still match. If it fails, fix and run again. Do not add Playwright files to git. |
| C011 | T0 | `AGENTS.md` | Every time a roadmap item is completed mark it as done in the ROADMAP.md |
| C012 | T1 | `.claude/skills/harness-eval/SKILL.md` | Evaluate a repo agent harness (AGENTS.md, rules, skills, skill refs) for broken paths/commands, redundant instructions, and usefulness using a stack-agnostic dual-judge protocol with planted traps. HIGH PRIORITY questionnaires at top: Q1 optional docs, Q2 B/C budget before Track A (certainty/tokens). A always runs after Q2; B/C opt-in. ADRs/RFCs excluded from T2. Mixed apply uses 11-mixed-apply.md (KEEP/CUT). Use when the user says harness eval, harness-eval, harness debug, audit AGENTS.md, audi |
| C013 | T1 | `.claude/skills/harness-eval/SKILL.md` | Run a full, stack-agnostic harness evaluation and stop at reports. Do not auto-edit AGENTS.md or skills unless the user explicitly asks after reviewing Ship/Slim. |
| C014 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Stop and ask before continuing.** Do not skip these gates. Do not silently include optional docs or spawn B/C judges. |
| C015 | T1 | `.claude/skills/harness-eval/SKILL.md` | Order after inventory: **Q1 (if needed) → Q2 → then Track A** (A always runs) → B/C only if approved. |
| C016 | T1 | `.claude/skills/harness-eval/SKILL.md` | When `optional-docs-candidates.md` lists optional types, ask before Q2 / Track A: |
| C017 | T1 | `.claude/skills/harness-eval/SKILL.md` | Re-run inventory with `--include-doc-type` / `--include-doc` only after the user answers. If no optional types, skip Q1. |
| C018 | T1 | `.claude/skills/harness-eval/SKILL.md` | Ask **before** Track A so the user sets spend up front. Track **A always runs** next (deterministic, ~0 model tokens). B/C run only if approved. |
| C019 | T1 | `.claude/skills/harness-eval/SKILL.md` | Fill claim count from `claims.md` when known; surface count ≈ T0+T1+T2 markdown after extract (or say “after surfaces_extract” if not run yet). |
| C020 | T1 | `.claude/skills/harness-eval/SKILL.md` | **`A only`:** run Track A; present `04`; stop (no B/C judges). |
| C021 | T1 | `.claude/skills/harness-eval/SKILL.md` | **`B`:** Track A, then Steps 4–6. |
| C022 | T1 | `.claude/skills/harness-eval/SKILL.md` | **`C`:** Track A, then Steps 7–10 (C does not need B). |
| C023 | T1 | `.claude/skills/harness-eval/SKILL.md` | **`B+C`:** Track A, then Steps 4–11. |
| C024 | T1 | `.claude/skills/harness-eval/SKILL.md` | If the user already requested B/C/`full eval` in the triggering message, treat as approval — still show the Q2 table once so costs are visible. |
| C025 | T1 | `.claude/skills/harness-eval/SKILL.md` | This skill is **self-contained**. Protocol, scripts, and judge prompts live under this skill directory (the folder that contains this `SKILL.md`). Resolve `SKILL_DIR` as that directory — never assume another install path. |
| C026 | T1 | `.claude/skills/harness-eval/SKILL.md` | Read [references/PROTOCOL.md](references/PROTOCOL.md) **completely** before the first run in a session (and again if scripts fail). |
| C027 | T1 | `.claude/skills/harness-eval/SKILL.md` | Read [references/judge-prompts.md](references/judge-prompts.md) when spawning Track B or Track C judges. |
| C028 | T1 | `.claude/skills/harness-eval/SKILL.md` | Plain-language terms: [references/GLOSSARY.md](references/GLOSSARY.md) (also embedded at the top of `04` / `07` / `10` reports). |
| C029 | T1 | `.claude/skills/harness-eval/SKILL.md` | Claim record shape: [references/claims.schema.json](references/claims.schema.json) (for tooling; agents do not need to load it every run). |
| C030 | T1 | `.claude/skills/harness-eval/SKILL.md` | Run scripts as `python3 "$SKILL_DIR/scripts/<name>.py" ...`. |
| C031 | T1 | `.claude/skills/harness-eval/SKILL.md` | Run **outputs** (not protocol) go to the target repo at `.harness-eval/runs/<run-id>/`. |
| C032 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Report-only by default.** Judgment ≠ remediation. |
| C033 | T1 | `.claude/skills/harness-eval/SKILL.md` | **README out of scope** as harness surface and as rediscovery/usefulness evidence. |
| C034 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Stack-agnostic.** Never hard-code package managers, DBs, frameworks, or folder layouts in prompts or plants. Discover manifests that exist (JS, Python, Make/Task, Rust, Go, PHP, Ruby/Rails, Java/Gradle/Maven, plus `bin/*`). |
| C035 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Doc scope.** T2 always includes agent skill-tree refs (`.agents/skills`, `.cursor/skills`, `.claude/skills`). **ADRs / RFCs (decision-record trees) are always excluded** from T2 surfaces. Other cited project docs are **optional** — default omit; ask via **Q1** at the top of this skill, then re-run with `--include-doc-type` / `--include-doc`. |
| C036 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Track A always runs** after inventory (deterministic, high-precision). Prefer false negatives over false BROKEN. Placeholders (`SPEC_FOLDER`, `{x}`, `[feature]`) are never BROKEN. Never normalize paths with `str.lstrip('./')`. |
| C037 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Tracks B and C require user approval via Q2 before Track A.** Do not spawn B/C judges until the user opts in. User may approve B only, C only, both, or A only. |
| C038 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Track B needs dual judges + plants.** Judge2 is blind (must not read Judge1 scores or `trap-key.json`). Ship only if trap gate PASS and dual REDUNDANT with Judge2 cost ≤ 1. |
| C039 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Track C needs dual judges + plants.** Blind Judge2 must not read `08-usefulness-j1.md` or `usefulness-trap-key.json`. Slim only if trap PASS, dual SLIM/ROUTING-ONLY, **and fan-in PASS** (no other harness surface hard-loads the path as SoT — merge enforces this on the full skill tree, not just `--seed`). **Usefulness is model-sensitive** — record `model: <id>` in both score files; prefer same model within a run; re-judge on a second model before large Slim deletes. |
| C040 | T1 | `.claude/skills/harness-eval/SKILL.md` | **KEEP / KEEP-CORE plants must not be verbatim copies** of claims/surfaces already in the deck. |
| C041 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Subagents:** use an allowlisted non-fast model (prefer the same family as the parent when policy allows). Do not use `*-fast` models. |
| C042 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Do not equate tracks.** Track B Ship ≠ Track C Slim. Rediscoverable ≠ useless; useful ≠ non-redundant. |
| C043 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Slim apply / fan-in.** Never stub or delete a Slim path listed under “Slim fan-in blocked” (or when `python3 "$SKILL_DIR/scripts/slim_fanin.py" --path <P>` reports citers) unless those consumers are updated in the same change. |
| C044 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Mixed/Slim apply stays self-contained.** Cutting REPO-DEMONSTRATED / THEORY means delete or compress that bulk in the harness surface. Never replace a fenced teaching snippet (or the contract it carried) with `See app/...` / `lib/...` / `test/...` — that swaps SoT for a code-tree pointer. Judge evidence paths stay in score tables only; if the behavior-changing contract must survive, keep a short in-skill rule or snippet. |
| C045 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Mixed apply is mechanical.** Dual MIXED alone is not enough. Merge emits `11-mixed-apply.md` with per-ID **KEEP** (from Keep-core columns) and **CUT** (from Slim columns). Apply agents must follow that file only — do not re-judge, redesign, or invent a different pattern than KEEP. Empty Keep-core/Slim cells → skip that path (Hold). |
| C046 | T1 | `.claude/skills/harness-eval/SKILL.md` | Set `SKILL_DIR` to the directory containing this `SKILL.md`. Verify: |
| C047 | T1 | `.claude/skills/harness-eval/SKILL.md` | `$SKILL_DIR/references/PROTOCOL.md` |
| C048 | T1 | `.claude/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/inventory_extract.py` |
| C049 | T1 | `.claude/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/track_a_correctness.py` |
| C050 | T1 | `.claude/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/merge_agreement.py` |
| C051 | T1 | `.claude/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/surfaces_extract.py` |
| C052 | T1 | `.claude/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/merge_usefulness.py` |
| C053 | T1 | `.claude/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/slim_fanin.py` |
| C054 | T1 | `.claude/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/doc_scope.py` |
| C055 | T1 | `.claude/skills/harness-eval/SKILL.md` | If missing, the skill install is broken — stop. |
| C056 | T1 | `.claude/skills/harness-eval/SKILL.md` | From the **target repo root**: |
| C057 | T1 | `.claude/skills/harness-eval/SKILL.md` | Expected under `.harness-eval/runs/$RUN_ID/`: `inventory.json`, `claims.jsonl`, `claims.md`, `trap-key.json`, `optional-docs-candidates.md` (+ `.json`). |
| C058 | T1 | `.claude/skills/harness-eval/SKILL.md` | Read `optional-docs-candidates.md`. If optional types exist, run **Q1** from [User questionnaires](#user-questionnaires-high-priority). Re-run inventory only after approval: |
| C059 | T1 | `.claude/skills/harness-eval/SKILL.md` | Run **Q2** from [User questionnaires](#user-questionnaires-high-priority) **before** Track A. Record the answer (`A only` / `B` / `C` / `B+C`). Do not start Steps 4+ unless B and/or C were approved. |
| C060 | T1 | `.claude/skills/harness-eval/SKILL.md` | Expected: `04-correctness.md` (includes term definitions at top). Spot-check that `.agents/...` cites resolve (not `agents/...`). |
| C061 | T1 | `.claude/skills/harness-eval/SKILL.md` | Summarize Track A (broken count + notable clusters). If Q2 was `A only`, stop. Otherwise continue to the approved B and/or C steps. |
| C062 | T1 | `.claude/skills/harness-eval/SKILL.md` | Read `references/judge-prompts.md` (Track B Judge1). Spawn an independent subagent with an allowlisted model. Point it at `.harness-eval/runs/$RUN_ID/claims.md`. It writes `05-redundancy-j1.md` (include `model: <id>`). |
| C063 | T1 | `.claude/skills/harness-eval/SKILL.md` | Judge1 may read `inventory.json`. Must not read `trap-key.json`. |
| C064 | T1 | `.claude/skills/harness-eval/SKILL.md` | Read `references/judge-prompts.md` (Track B Judge2). Spawn a second subagent. Writes `06-blind-scores.md`. |
| C065 | T1 | `.claude/skills/harness-eval/SKILL.md` | Forbidden for Judge2: `trap-key.json`, `05-redundancy-j1.md`, `07-agreement.md`, prior agreement reports. |
| C066 | T1 | `.claude/skills/harness-eval/SKILL.md` | Prefer Steps 4 and 5 in parallel. |
| C067 | T1 | `.claude/skills/harness-eval/SKILL.md` | Expected: `07-agreement.md` (Ship/Review/Hold + **What these words mean**). On trap FAIL: fix plants per PROTOCOL, rescore P00x, re-merge — do not Ship. |
| C068 | T1 | `.claude/skills/harness-eval/SKILL.md` | Expected: `surfaces.md`, `surfaces.json`, `usefulness-trap-key.json`. |
| C069 | T1 | `.claude/skills/harness-eval/SKILL.md` | Read `references/judge-prompts.md` (Usefulness Judge1). Spawn subagent with allowlisted model (record same id in header). Writes `08-usefulness-j1.md`. |
| C070 | T1 | `.claude/skills/harness-eval/SKILL.md` | Must not read `usefulness-trap-key.json`. |
| C071 | T1 | `.claude/skills/harness-eval/SKILL.md` | Read Usefulness Judge2 prompt. Prefer **same model** as Step 8 for agreement stability. Writes `09-usefulness-j2.md`. |
| C072 | T1 | `.claude/skills/harness-eval/SKILL.md` | Forbidden: `usefulness-trap-key.json`, `08-usefulness-j1.md`, `10-usefulness-agreement.md`, and using Track B 05/06/07 to decide usefulness classes. |
| C073 | T1 | `.claude/skills/harness-eval/SKILL.md` | Prefer Steps 8 and 9 in parallel. |
| C074 | T1 | `.claude/skills/harness-eval/SKILL.md` | Expected: `10-usefulness-agreement.md` (Slim/Keep-core/Mixed/Hold + **What these words mean**), `11-mixed-apply.md` (KEEP/CUT per Mixed ID), plus `slim-fanin.json`. On trap FAIL: do not Slim. Surfaces with `slim-fanin-blocked` are Hold — not Slim apply candidates. |
| C075 | T1 | `.claude/skills/harness-eval/SKILL.md` | Summarize from the agreement reports (each starts with term definitions): |
| C076 | T1 | `.claude/skills/harness-eval/SKILL.md` | Track A broken count → `04-correctness.md` |
| C077 | T1 | `.claude/skills/harness-eval/SKILL.md` | Track B trap + Ship/Review/Hold → `07-agreement.md` |
| C078 | T1 | `.claude/skills/harness-eval/SKILL.md` | Track C trap + fan-in + Slim/Keep-core/Mixed/Hold → `10-usefulness-agreement.md` |
| C079 | T1 | `.claude/skills/harness-eval/SKILL.md` | Call out `11-mixed-apply.md` when Mixed count > 0 (the only Mixed apply path) |
| C080 | T1 | `.claude/skills/harness-eval/SKILL.md` | Call out model ids used for Track C and that Slim is model-sensitive |
| C081 | T1 | `.claude/skills/harness-eval/SKILL.md` | Call out any **Slim fan-in blocked** rows (consumers outside seed may appear here) |
| C082 | T1 | `.claude/skills/harness-eval/SKILL.md` | Stop unless the user asks to apply Ship/Slim/Mixed. When applying: |
| C083 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Slim:** only paths in the Slim table (fan-in PASS); never stub fan-in-blocked paths without updating citers first. |
| C084 | T1 | `.claude/skills/harness-eval/SKILL.md` | **Mixed:** open `11-mixed-apply.md` and execute KEEP/CUT per ID only (rule 12). Never re-judge from the Mixed path list alone. Never add code-tree path pointers as substitutes for cut demos (rule 11). |
| C085 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Evaluate a repo agent harness (AGENTS.md, rules, skills, skill refs) for broken paths/commands, redundant instructions, and usefulness using a stack-agnostic dual-judge protocol with planted traps. HIGH PRIORITY questionnaires at top: Q1 optional docs, Q2 B/C budget before Track A (certainty/tokens). A always runs after Q2; B/C opt-in. ADRs/RFCs excluded from T2. Mixed apply uses 11-mixed-apply.md (KEEP/CUT). Use when the user says harness eval, harness-eval, harness debug, audit AGENTS.md, audi |
| C086 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Run a full, stack-agnostic harness evaluation and stop at reports. Do not auto-edit AGENTS.md or skills unless the user explicitly asks after reviewing Ship/Slim. |
| C087 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Stop and ask before continuing.** Do not skip these gates. Do not silently include optional docs or spawn B/C judges. |
| C088 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Order after inventory: **Q1 (if needed) → Q2 → then Track A** (A always runs) → B/C only if approved. |
| C089 | T1 | `.cursor/skills/harness-eval/SKILL.md` | When `optional-docs-candidates.md` lists optional types, ask before Q2 / Track A: |
| C090 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Re-run inventory with `--include-doc-type` / `--include-doc` only after the user answers. If no optional types, skip Q1. |
| C091 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Ask **before** Track A so the user sets spend up front. Track **A always runs** next (deterministic, ~0 model tokens). B/C run only if approved. |
| C092 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Fill claim count from `claims.md` when known; surface count ≈ T0+T1+T2 markdown after extract (or say “after surfaces_extract” if not run yet). |
| C093 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **`A only`:** run Track A; present `04`; stop (no B/C judges). |
| C094 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **`B`:** Track A, then Steps 4–6. |
| C095 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **`C`:** Track A, then Steps 7–10 (C does not need B). |
| C096 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **`B+C`:** Track A, then Steps 4–11. |
| C097 | T1 | `.cursor/skills/harness-eval/SKILL.md` | If the user already requested B/C/`full eval` in the triggering message, treat as approval — still show the Q2 table once so costs are visible. |
| C098 | T1 | `.cursor/skills/harness-eval/SKILL.md` | This skill is **self-contained**. Protocol, scripts, and judge prompts live under this skill directory (the folder that contains this `SKILL.md`). Resolve `SKILL_DIR` as that directory — never assume another install path. |
| C099 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Read [references/PROTOCOL.md](references/PROTOCOL.md) **completely** before the first run in a session (and again if scripts fail). |
| C100 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Read [references/judge-prompts.md](references/judge-prompts.md) when spawning Track B or Track C judges. |
| C101 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Plain-language terms: [references/GLOSSARY.md](references/GLOSSARY.md) (also embedded at the top of `04` / `07` / `10` reports). |
| C102 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Claim record shape: [references/claims.schema.json](references/claims.schema.json) (for tooling; agents do not need to load it every run). |
| C103 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Run scripts as `python3 "$SKILL_DIR/scripts/<name>.py" ...`. |
| C104 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Run **outputs** (not protocol) go to the target repo at `.harness-eval/runs/<run-id>/`. |
| C105 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Report-only by default.** Judgment ≠ remediation. |
| C106 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **README out of scope** as harness surface and as rediscovery/usefulness evidence. |
| C107 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Stack-agnostic.** Never hard-code package managers, DBs, frameworks, or folder layouts in prompts or plants. Discover manifests that exist (JS, Python, Make/Task, Rust, Go, PHP, Ruby/Rails, Java/Gradle/Maven, plus `bin/*`). |
| C108 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Doc scope.** T2 always includes agent skill-tree refs (`.agents/skills`, `.cursor/skills`, `.claude/skills`). **ADRs / RFCs (decision-record trees) are always excluded** from T2 surfaces. Other cited project docs are **optional** — default omit; ask via **Q1** at the top of this skill, then re-run with `--include-doc-type` / `--include-doc`. |
| C109 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Track A always runs** after inventory (deterministic, high-precision). Prefer false negatives over false BROKEN. Placeholders (`SPEC_FOLDER`, `{x}`, `[feature]`) are never BROKEN. Never normalize paths with `str.lstrip('./')`. |
| C110 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Tracks B and C require user approval via Q2 before Track A.** Do not spawn B/C judges until the user opts in. User may approve B only, C only, both, or A only. |
| C111 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Track B needs dual judges + plants.** Judge2 is blind (must not read Judge1 scores or `trap-key.json`). Ship only if trap gate PASS and dual REDUNDANT with Judge2 cost ≤ 1. |
| C112 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Track C needs dual judges + plants.** Blind Judge2 must not read `08-usefulness-j1.md` or `usefulness-trap-key.json`. Slim only if trap PASS, dual SLIM/ROUTING-ONLY, **and fan-in PASS** (no other harness surface hard-loads the path as SoT — merge enforces this on the full skill tree, not just `--seed`). **Usefulness is model-sensitive** — record `model: <id>` in both score files; prefer same model within a run; re-judge on a second model before large Slim deletes. |
| C113 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **KEEP / KEEP-CORE plants must not be verbatim copies** of claims/surfaces already in the deck. |
| C114 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Subagents:** use an allowlisted non-fast model (prefer the same family as the parent when policy allows). Do not use `*-fast` models. |
| C115 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Do not equate tracks.** Track B Ship ≠ Track C Slim. Rediscoverable ≠ useless; useful ≠ non-redundant. |
| C116 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Slim apply / fan-in.** Never stub or delete a Slim path listed under “Slim fan-in blocked” (or when `python3 "$SKILL_DIR/scripts/slim_fanin.py" --path <P>` reports citers) unless those consumers are updated in the same change. |
| C117 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Mixed/Slim apply stays self-contained.** Cutting REPO-DEMONSTRATED / THEORY means delete or compress that bulk in the harness surface. Never replace a fenced teaching snippet (or the contract it carried) with `See app/...` / `lib/...` / `test/...` — that swaps SoT for a code-tree pointer. Judge evidence paths stay in score tables only; if the behavior-changing contract must survive, keep a short in-skill rule or snippet. |
| C118 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Mixed apply is mechanical.** Dual MIXED alone is not enough. Merge emits `11-mixed-apply.md` with per-ID **KEEP** (from Keep-core columns) and **CUT** (from Slim columns). Apply agents must follow that file only — do not re-judge, redesign, or invent a different pattern than KEEP. Empty Keep-core/Slim cells → skip that path (Hold). |
| C119 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Set `SKILL_DIR` to the directory containing this `SKILL.md`. Verify: |
| C120 | T1 | `.cursor/skills/harness-eval/SKILL.md` | `$SKILL_DIR/references/PROTOCOL.md` |
| C121 | T1 | `.cursor/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/inventory_extract.py` |
| C122 | T1 | `.cursor/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/track_a_correctness.py` |
| C123 | T1 | `.cursor/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/merge_agreement.py` |
| C124 | T1 | `.cursor/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/surfaces_extract.py` |
| C125 | T1 | `.cursor/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/merge_usefulness.py` |
| C126 | T1 | `.cursor/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/slim_fanin.py` |
| C127 | T1 | `.cursor/skills/harness-eval/SKILL.md` | `$SKILL_DIR/scripts/doc_scope.py` |
| C128 | T1 | `.cursor/skills/harness-eval/SKILL.md` | If missing, the skill install is broken — stop. |
| C129 | T1 | `.cursor/skills/harness-eval/SKILL.md` | From the **target repo root**: |
| C130 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Expected under `.harness-eval/runs/$RUN_ID/`: `inventory.json`, `claims.jsonl`, `claims.md`, `trap-key.json`, `optional-docs-candidates.md` (+ `.json`). |
| C131 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Read `optional-docs-candidates.md`. If optional types exist, run **Q1** from [User questionnaires](#user-questionnaires-high-priority). Re-run inventory only after approval: |
| C132 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Run **Q2** from [User questionnaires](#user-questionnaires-high-priority) **before** Track A. Record the answer (`A only` / `B` / `C` / `B+C`). Do not start Steps 4+ unless B and/or C were approved. |
| C133 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Expected: `04-correctness.md` (includes term definitions at top). Spot-check that `.agents/...` cites resolve (not `agents/...`). |
| C134 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Summarize Track A (broken count + notable clusters). If Q2 was `A only`, stop. Otherwise continue to the approved B and/or C steps. |
| C135 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Read `references/judge-prompts.md` (Track B Judge1). Spawn an independent subagent with an allowlisted model. Point it at `.harness-eval/runs/$RUN_ID/claims.md`. It writes `05-redundancy-j1.md` (include `model: <id>`). |
| C136 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Judge1 may read `inventory.json`. Must not read `trap-key.json`. |
| C137 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Read `references/judge-prompts.md` (Track B Judge2). Spawn a second subagent. Writes `06-blind-scores.md`. |
| C138 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Forbidden for Judge2: `trap-key.json`, `05-redundancy-j1.md`, `07-agreement.md`, prior agreement reports. |
| C139 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Prefer Steps 4 and 5 in parallel. |
| C140 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Expected: `07-agreement.md` (Ship/Review/Hold + **What these words mean**). On trap FAIL: fix plants per PROTOCOL, rescore P00x, re-merge — do not Ship. |
| C141 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Expected: `surfaces.md`, `surfaces.json`, `usefulness-trap-key.json`. |
| C142 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Read `references/judge-prompts.md` (Usefulness Judge1). Spawn subagent with allowlisted model (record same id in header). Writes `08-usefulness-j1.md`. |
| C143 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Must not read `usefulness-trap-key.json`. |
| C144 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Read Usefulness Judge2 prompt. Prefer **same model** as Step 8 for agreement stability. Writes `09-usefulness-j2.md`. |
| C145 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Forbidden: `usefulness-trap-key.json`, `08-usefulness-j1.md`, `10-usefulness-agreement.md`, and using Track B 05/06/07 to decide usefulness classes. |
| C146 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Prefer Steps 8 and 9 in parallel. |
| C147 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Expected: `10-usefulness-agreement.md` (Slim/Keep-core/Mixed/Hold + **What these words mean**), `11-mixed-apply.md` (KEEP/CUT per Mixed ID), plus `slim-fanin.json`. On trap FAIL: do not Slim. Surfaces with `slim-fanin-blocked` are Hold — not Slim apply candidates. |
| C148 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Summarize from the agreement reports (each starts with term definitions): |
| C149 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Track A broken count → `04-correctness.md` |
| C150 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Track B trap + Ship/Review/Hold → `07-agreement.md` |
| C151 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Track C trap + fan-in + Slim/Keep-core/Mixed/Hold → `10-usefulness-agreement.md` |
| C152 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Call out `11-mixed-apply.md` when Mixed count > 0 (the only Mixed apply path) |
| C153 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Call out model ids used for Track C and that Slim is model-sensitive |
| C154 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Call out any **Slim fan-in blocked** rows (consumers outside seed may appear here) |
| C155 | T1 | `.cursor/skills/harness-eval/SKILL.md` | Stop unless the user asks to apply Ship/Slim/Mixed. When applying: |
| C156 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Slim:** only paths in the Slim table (fan-in PASS); never stub fan-in-blocked paths without updating citers first. |
| C157 | T1 | `.cursor/skills/harness-eval/SKILL.md` | **Mixed:** open `11-mixed-apply.md` and execute KEEP/CUT per ID only (rule 12). Never re-judge from the Mixed path list alone. Never add code-tree path pointers as substitutes for cut demos (rule 11). |
| C158 | T1 | `.cursor/skills/the-judge/SKILL.md` | Evidence-first pull request judge that reviews a PR and posts one consolidated GitHub review with inline comments via the gh CLI. Runs the repo's own deterministic checks first, researches current official docs before any claim about external libraries or APIs, then reviews correctness, security, structural quality (code judo, spaghetti growth, file-size limits), and AI slop including useless code comments. Every finding must carry evidence, every comment passes a deterministic noise gate before |
| C159 | T1 | `.cursor/skills/the-judge/SKILL.md` | Review a pull request like a senior engineer with a high conviction bar: few comments, every one backed by evidence, posted as a single consolidated GitHub review. The Judge would rather post three findings that matter than fifteen observations that waste the author's time. |
| C160 | T1 | `.cursor/skills/the-judge/SKILL.md` | These rules override everything else in this skill. Read them before doing anything. |
| C161 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Evidence or silence.** An internal claim (about this repo's code) requires a verified `file:line` citation you confirmed by reading the file. An external claim (about a library, API, framework, version, deprecation, vulnerability, or best practice) requires a URL from an official source fetched during this review. A finding without evidence is not posted. Period. |
| C162 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Never assert external behavior from memory.** Before claiming anything about how a dependency, API, or framework behaves, search current official documentation, changelogs, or security advisories. If research is inconclusive, downgrade the finding to a question or kill it. Training data is a rumor; the changelog is a source. |
| C163 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Noise budget.** Maximum 5 nit comments inline; overflow becomes a count in the summary. Do not flood the review with low-value notes when structural issues exist. Prefer a small number of high-conviction comments. |
| C164 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Never comment on what the repo's own tooling catches.** Run the repo's linters, type checkers, and focused tests first (Step 1). Anything they flag is out of scope for review comments. |
| C165 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Every comment passes the gate.** All comment bodies and the summary must pass `scripts/review_gate.py` with exit code 0 before posting. No exceptions, no manual overrides. |
| C166 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Language: the user chooses; English is the default.** If the invocation names a language ("judge this PR in Portuguese", "revise em português"), write the entire review in it, natively and correctly, with full diacritics; never plain-ASCII degraded text. Absent an explicit request, write in English. Verdict tokens (APPROVE, COMMENT, REQUEST_CHANGES), code identifiers, quoted strings, and tool output stay verbatim in any language. |
| C167 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Spend tokens where judgment lives.** Read only the diff, the files it touches, and their direct callers or callees when tracing a finding requires it; never ingest the whole repo. Detection a regex can do runs in `scripts/scan_bypasses.py`, not in prose. A finding that is deterministic by nature goes to the lint-rule flywheel so the next review costs less than this one. |
| C168 | T1 | `.cursor/skills/the-judge/SKILL.md` | **The first review is the whole review.** Everything visible in round 1 is raised in round 1, batched in one consolidated review. Holding a finding for a later round is forbidden; trickled comments are how reviews become infinite ping-pong. Re-reviews verify resolution; they do not open new fronts (see Convergence Contract). |
| C169 | T1 | `.cursor/skills/the-judge/SKILL.md` | Verdict mapping: any 🔴 present, REQUEST_CHANGES. Zero 🔴 and zero 🟠, APPROVE. Anything else, COMMENT. |
| C170 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Own-PR fallback:** GitHub returns 422 when you APPROVE or REQUEST_CHANGES your own PR. `scripts/post_review.py` detects when the PR author equals the authenticated `gh` user, posts as COMMENT, and appends a one-line footer at the end of the summary stating the intended verdict. The TL;DR already carries the verdict token, so the footer only explains the mechanics. Do not fight this; it is API behavior. |
| C171 | T1 | `.cursor/skills/the-judge/SKILL.md` | Classify every changed file as **core** or **mechanical** (generated code, lockfiles, snapshots, vendored deps, build artifacts, migrations output). Mechanical files are skipped and listed in the summary. Detect moved code: 3+ consecutive lines deleted in one place and added identically elsewhere is a move, not new code; do not re-review it as new. |
| C172 | T1 | `.cursor/skills/the-judge/SKILL.md` | Determine the round. Fetch your own previous reviews on this PR: |
| C173 | T1 | `.cursor/skills/the-judge/SKILL.md` | No previous review: this is round 1, run the full workflow. Previous review exists: this is round N, load the findings ledger (the ID table) from the latest previous summary and follow the Convergence Contract instead of a full re-run. |
| C174 | T1 | `.cursor/skills/the-judge/SKILL.md` | If the diff exceeds roughly 400 changed lines in core files and the harness supports subagents, run the Step 3 passes as parallel subagents. Otherwise run them sequentially. Never make subagent support a requirement. |
| C175 | T1 | `.cursor/skills/the-judge/SKILL.md` | Detect and run the repo's own checks: lint, typecheck, and tests focused on changed files (look at `package.json` scripts, `Makefile`, `pyproject.toml`, CI config). If the repo already runs security scanners (dependency, IaC, or SAST tools wired into its CI), run them or read their current output as deterministic input too. Record results. Findings these tools produce are excluded from your review scope; you judge only what they cannot. If the repo has no such tooling, note that in the summary and move on; do not install anything. |
| C176 | T1 | `.cursor/skills/the-judge/SKILL.md` | Then run the deterministic bypass scan: |
| C177 | T1 | `.cursor/skills/the-judge/SKILL.md` | It prints `path:line category content` for every bypass marker added by the diff (suppression directives, dodged tests, TLS and type-check bypasses, swallowed errors, sleep-as-synchronization). Scan hits are candidates for Pass F, not findings: a suppression carrying a justification and an issue link is acceptable; a naked one is not. The scan exists so zero LLM tokens are spent detecting what a regex detects. |
| C178 | T1 | `.cursor/skills/the-judge/SKILL.md` | Enumerate every external surface the diff touches: dependencies added or version-bumped (read the manifest/lockfile diff), APIs called, framework features used, language features that are version-sensitive. For each surface, search current official documentation, release notes, and security advisories. Log every consulted URL; the summary includes a research log. This step is not optional and not skippable, even when you feel confident. Confidence from memory is exactly the failure mode this step exists to kill. If the diff touches zero external surfaces, state that in the research log. |
| C179 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Completeness contract:** round 1 covers all core files across all passes, in depth, in one shot. Nothing is deferred to "a later look". A finding you could have raised now and raise later is a broken contract with the author. One exception to volume: do not stack comments on code a structural finding will rewrite; if a 🔴 or 🟠 asks for a block to be restructured, withhold nits inside that block and note "nits withheld on lines the structural fix rewrites" in the summary. |
| C180 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Read `references/review-standards.md` now.** Run six passes over core files: |
| C181 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Pass A. Correctness and logic**: broken invariants, unhandled failure paths that lose data, partial state, concrete concurrency hazards. |
| C182 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Pass B. Security**: high-confidence exploitability only, newly introduced by this PR, with the hard exclusion and precedent lists applied. |
| C183 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Pass C. Structure and maintainability**: the ambitious structural pass. Code judo, file-size limits, spaghetti growth, boundaries, canonical layer. |
| C184 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Pass D. AI slop and useless code comments**: comments that restate code, changelog comments, docstring bloat, commented-out code, defensive try/catch on trusted paths, speculative abstractions. |
| C185 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Pass E. PR description claims**: every claim of "fixes X" or "improves Y" needs evidence (test, repro, measurement) or becomes a question. |
| C186 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Pass F. Bypasses, duplication, and gambiarras**: suppression directives, dodged tests, type and TLS bypasses, copy-paste duplication, magic values, sleep-as-synchronization, unlabeled workarounds. Seeded by the Step 1 bypass scan; every scan hit gets judged here. |
| C187 | T1 | `.cursor/skills/the-judge/SKILL.md` | Each pass produces candidate findings: claim, tentative severity, evidence pointer. If the harness supports choosing a model per subagent, use light, fast variants for mechanical work (file classification, dedupe, scan triage) and reserve the strongest model for the judgment passes and verification; burning the heavy model on cheap triage is waste, and burning the light model on judgment is false positives. |
| C188 | T1 | `.cursor/skills/the-judge/SKILL.md` | For each candidate: re-read the actual code at the cited location and confirm the claim holds. Re-apply the exclusion lists. Kill anything you cannot evidence. Deduplicate across passes. Assign final severity conservatively: a blocker you are not certain of is a should-fix phrased as a question. This pass exists because candidate generation is optimized for recall and posting is optimized for precision. |
| C189 | T1 | `.cursor/skills/the-judge/SKILL.md` | Two grounding rules: |
| C190 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Reproduce when feasible.** A 🔴 from Pass A or Pass B that can be demonstrated locally gets the strongest evidence class there is: a failing test or a short script run inside the repo's own test harness (never network attacks, never outside the sandbox of the checkout). Record the command and its output as `repro` evidence. The inverse binds too: when a reproduction was feasible and failed to reproduce the claim, the finding dies, whatever your reading of the code said. |
| C191 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Low risk is not false positive.** Severity and validity are orthogonal axes. A real but minor issue is a 🟡, not a discard; killing findings because they are small is how a filter quietly stops detecting real problems. Kill for lack of evidence, downgrade for lack of impact, never conflate the two. |
| C192 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Read `references/comment-voice.md` now.** Write the summary and every comment body under that spec. Produce `findings.json`: |
| C193 | T1 | `.cursor/skills/the-judge/SKILL.md` | `round` defaults to 1. `carryover` counts previous-round findings still unresolved (zeros in round 1); the gate uses it to compute the correct verdict when the new-findings list alone would understate open risk. `id` values are stable across rounds (F1 stays F1 forever) so the resolution ledger maps cleanly. Evidence entries accept three types: `internal` (verified `path:line`), `external` (https URL from an official source fetched this review), and `repro` (the local command that demonstrates the claim, with its observed result in the finding body). |
| C194 | T1 | `.cursor/skills/the-judge/SKILL.md` | Rules the gate enforces (write to them from the start): body starts with the severity emoji; blocker and should-fix require at least one evidence entry; external evidence must be an https URL; pre-existing findings have no `line`; the summary contains a TL;DR section and a lint-rule section. |
| C195 | T1 | `.cursor/skills/the-judge/SKILL.md` | Fix every reported violation and re-run until exit code 0. The gate is deterministic; arguing with it is arguing with a regex. |
| C196 | T1 | `.cursor/skills/the-judge/SKILL.md` | Posts everything as one review (single API call: summary body, verdict event, positioned inline comments), handles the own-PR fallback, prints the review URL. Inline comments only anchor on lines present in the diff; the script tells you which comment failed if GitHub rejects an anchor. |
| C197 | T1 | `.cursor/skills/the-judge/SKILL.md` | The Judge is decisive: it converges reviews instead of stretching them. Round 1 is exhaustive; every later round shrinks. The failure mode this contract kills is the infinite ping-pong where each round discovers a new front. |
| C198 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Round N (N >= 2) scope is exactly two things:** |
| C199 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Resolution check.** For every finding in the previous ledger, verify against the new commits: resolved (cite the fixing commit), still open, or declined by the author. Report all of them in the Resolution table. This is the focus of the re-review; it is a checklist verification, not a fresh hunt. |
| C200 | T1 | `.cursor/skills/the-judge/SKILL.md` | **New blockers only.** The diff since the last reviewed commit is examined solely for 🔴 introduced by the fix itself. No new 🟠, no new 🟡, no new 🟣, ever. Code that was visible in round 1 and not flagged then is forfeited: the reviewer eats the miss. The single exception is a genuine 🔴 (exploitable security, data loss, money) discovered late, which is always raised, labeled factually as missed in round 1. |
| C201 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Declined findings.** When the author declines with a reason, first consider that they are closer to the code and may be right; if the reasoning holds from a code-health perspective, record declined-accepted and drop it permanently. If it does not hold, re-argue once with new evidence, at most once. Still unresolved after that: mark it open, state that the disagreement moves out of the review thread, and stop re-raising. Comment threads do not resolve philosophy. |
| C202 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Round cap.** By round 3, every remaining open finding is either fixed, converted to a follow-up issue by agreement, or escalated out of the thread. The Judge never runs a fourth round on the same finding set. |
| C203 | T1 | `.cursor/skills/the-judge/SKILL.md` | **Approval bar.** Approve as soon as the PR definitely improves overall code health, even if imperfect; perfect code does not exist, only better code. Unresolved 🟡 never blocks an APPROVE (approve with nits). Withholding approval to extract polish beyond the severity table is scope creep by the reviewer. |
| C204 | T1 | `.cursor/skills/the-judge/SKILL.md` | The gate enforces the mechanical half of this contract: with `"round": 2` or higher it rejects any non-blocker finding, requires the Resolution section, and requires `carryover` so the verdict reflects still-open previous findings. |
| C205 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Spec-driven feature work that freezes obligations instead of the plan: one human-reviewed plan with EARS criteria, path, entities, interface and one-way doors, then proof-backed checks, then build, then an independent Verifier. Use when the user says "tlc-spec-lean", "plan feature", "specify feature", "write the checks", "build this plan", or "verify work". Do NOT use for standalone design documents unattached to a feature, architecture decomposition analysis, or work that already has a task lis |
| C206 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Freeze the obligations. Free the plan. Prove it with someone who did not build it. Derived from tlc-spec-driven 3.3.0 (Felipe Rodrigues), tlc-plan, and tlc-implement. |
| C207 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Four moves, two artifacts before code, one after. A human confirms **what** must be true and |
| C208 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **how** it is being built in one document, and only then does any of it become an obligation with |
| C209 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | a proof attached. There is no task breakdown, and the plan carries no component catalogue: what is |
| C210 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | hard to reverse gets a one-way door with its literal shape, and everything reversible is decided |
| C211 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | while building and reviewed in the diff. |
| C212 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | The dominant failure of a coding agent is not bad reasoning, it is a requirement that was read |
| C213 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | and never became an active obligation - and then a completion claim on top of it. The |
| C214 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | mitigation that measures well is a **small, frozen, external obligation set** plus a |
| C215 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **verifier that is not the author**; a self-check reproduces the author's own blind spot. So |
| C216 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | this skill spends its budget on those two things and refuses to spend it on choreographing how |
| C217 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Two consequences worth stating up front, because they are what make this different from a |
| C218 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | conventional spec-driven flow: |
| C219 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **Granularity is not quality.** Splitting a feature into fifteen one-file tasks buys ordering, not correctness, and it costs a re-read of the process on every task. Proof coverage buys correctness. |
| C220 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **A plan the model must obey competes with the obligations for attention.** Fields like `Where`, `Tools`, `Depends on` are the model's job to decide, so they are not written down. |
| C221 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | The pinned set. These hold even if no reference file is read, and they are the only rules that |
| C222 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | never scale down with the profile. |
| C223 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Every check is **one observable claim with a concrete value** plus the **proof** - the test or command whose exit code settles it. No proof, no check. |
| C224 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Tests assert what the checks say, never what the code happens to do. Never write a test by reading the implementation. |
| C225 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Never weaken an assertion, delete a test, or skip one to make a suite pass. A genuinely wrong check is a stop-and-ask, not an edit. |
| C226 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Checks and `Test policy` rows are fixed once approved. In the design, `Landing`, `Relations` and `Surface` are additive - a door discovered while building gets a row before the code that closes it, and a row the user approved is never rewritten. `Flow` and `Impact` are neither: they are **kept true**, so a different path changes the hop in that path's commit. |
| C227 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | The **Verifier is a fresh sub-agent**, never the author, never optional, never waiting to be asked. Whoever holds the whole feature dispatches it after the **last commit of the feature** lands - over `<feature base>..HEAD`, with **every** check. Never by a builder, and never as a child of one. A builder finishes, reports, and stops. The work is not done at the last commit; it is done when the Verifier's report accounts for every check. |
| C228 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **The profile is a floor and it is not a secret.** The verification report names it, or "no faults injected" reads exactly like forgetting to inject them. |
| C229 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | The completion gate is a script, not a feeling: `validate_verification.py` must exit 0. |
| C230 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **Blast radius:** an approved spec authorizes local edits and local commits. `git push`, deploy, and production data changes need an explicit go-ahead for that action. |
| C231 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | The project declares how much runs, in `AGENTS.md` or equivalent. Absent a declaration: |
| C232 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | `light`. Same three levels as `tlc-implement`, gated the same way, so moving between the two |
| C233 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | skills needs no second vocabulary. |
| C234 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Each step adds a **class of failure detected**, so a cheap profile is not a discount on the |
| C235 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | same product - read the right column before choosing it. Two things about `light` are worth |
| C236 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | saying out loud, because its own row says them and they are easy to skim past: it will not |
| C237 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | notice an enumerated set member that nobody proved, and it will not notice a test that passes |
| C238 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | under a wrong implementation. `standard` exists for exactly those two. |
| C239 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | `ui` costs nothing on work with no interface: every screen step is conditional on a screen |
| C240 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | existing. A step whose input is empty costs a line, not a pass ("no set rows", "no binding |
| C241 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | The `Coverage` join is **written** into `checks.md` at every profile - the join is what makes an |
| C242 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | omission structural, and that costs nothing at authoring time. What `standard` buys is the |
| C243 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Verifier **recomputing** it from the authority over each set instead of reading the author's |
| C244 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | The profile is a pin, not a preference, and unlike `tlc-implement` that is enforced rather than |
| C245 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | asked for: `validate_verification.py` fails a report whose profile differs from the one |
| C246 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | `checks.md` was approved under, and fails a `standard` report with no fault rows or no |
| C247 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | recomputed coverage, and a `ui` report with no binding-sources section. So a step that did not |
| C248 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | run stays distinguishable from a step that was forgotten, which is the whole reason to declare |
| C249 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Where the profile looks too thin for the feature in hand, say so in one line and let the user |
| C250 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | raise it. Doing more than the profile in silence costs the predictability that made declaring |
| C251 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Create each file when its phase produces content. For a change under roughly three files with no |
| C252 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | one-way door, write only `checks.md` with an `## Intent` paragraph and skip `plan.md` - one |
| C253 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | bounded escape, not a sizing matrix. |
| C254 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | `plan.md` exists because a human has to be able to plan and object **before** anything turns into |
| C255 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | a claim with a test selector attached. Reading forty checks to reconstruct what is being built is |
| C256 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | not planning, and writing the checks in the same pass that decides the shape produces checks that |
| C257 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | ratify whatever was already assumed. |
| C258 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **Both halves live in one file because they are one review.** The file boundary is the semantic |
| C259 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | one: on this side, what a human confirms; on the other, obligations with proofs. Splitting the |
| C260 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | plan into a spec and a design would cut it in a place that matches neither, and would buy two |
| C261 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | mandatory stops for one feature. File order is for reading - Problem, Flow, Impact, then the |
| C262 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | rest of the shape, then the criteria, then the audit tables. Writing order is not: write the |
| C263 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | problem, walk the surfaces, write the criteria, then fill the shape. That is what stops a |
| C264 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | criterion from being invented to justify a component. The closure gate still requires every |
| C265 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | criterion to land somewhere in `Flow`, `Relations` or `Surface`, or it is out of scope or a |
| C266 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | The derivation into `checks.md` is the load-bearing part, not paperwork. Every route in `Surface` |
| C267 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | owes a `Coverage` set row whose members are its statuses; every door in `Landing` owes a check; |
| C268 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | every entity in `Relations` owes one. A shape section with nothing pointing back at it from |
| C269 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | `checks.md` is either dead or unproven, and `validate_checks.py` warns on the common case. |
| C270 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **The design half exists; the component catalogue does not.** What made design documents rot was |
| C271 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | never the diagram, it was `Purpose` / `Location` / `Interfaces` / `Dependencies` per class - |
| C272 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | reversible detail that goes stale within weeks and then misleads the next reader with the |
| C273 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | authority of a written document. None of those fields exists here. Five bounded sections: |
| C274 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **Which folder, how many classes, what the private method is called: the diff.** Reversible, |
| C275 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | answered by the repo's conventions, and never worth an artifact. That is the deliberate trade, |
| C276 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | and it is the only one. |
| C277 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | A bet still open when you get here - two architectures with live alternatives, each needing to be |
| C278 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | costed against this repository - does not fit in a `Landing` row, and a row is the only shape this |
| C279 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | artifact has for it. Whatever the project uses to settle one (an ADR, an RFC, a spike) comes |
| C280 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | first; then the plan records the shape that won and makes it reviewable. |
| C281 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **Plan** - the problem, then the path and what the change disturbs, then the rest of the shape, |
| C282 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | then the criteria. Writing still goes problem → surfaces → criteria → shape. Facts you look |
| C283 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | up; decisions you ask - and when you ask, concrete options with your recommendation, at most two |
| C284 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | per turn. **Two enumerations do the finding**, because "consider the edge cases" finds nothing: the |
| C285 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | surfaces this feature exposes, each carrying the same decisions every time it appears, and the nine |
| C286 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | implicit-requirement dimensions. Both take a mandatory `n/a - <reason>`, so a blank is an item |
| C287 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | nobody decided rather than one that does not apply. One artifact a human reads and objects to |
| C288 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | before any check exists. Full process, how to ask, rules per shape section, template and closure |
| C289 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | gate: [plan.md](references/plan.md). |
| C290 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **Checks** - derive claims with proofs from the plan, join every enumerated set member to a check, |
| C291 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | and record where each swept dimension landed. Close with `## Handoff` and the arithmetic; if |
| C292 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | the estimate exceeds the budget, stop for the mechanism ask before Build. This is the artifact |
| C293 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | everything downstream refers to by check number: [checks.md](references/checks.md). |
| C294 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **Build** - your call how, after the `## Handoff` arithmetic and, if the estimate exceeds the |
| C295 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | budget, the user's mechanism choice. Write the tests from the checks, implement, run each |
| C296 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | proof, commit in coherent pieces. No task list, no per-task review tables. Boundaries, |
| C297 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | `Landing` timing, handoff and the scope guardrail: [build.md](references/build.md). |
| C298 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **Verify** - when the last commit of the feature lands, dispatch a fresh Verifier in the |
| C299 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | same turn. Do not ask. Do not wait for "verify work". Procedure, report format and scoped |
| C300 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | re-verification: [verify.md](references/verify.md). |
| C301 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Durable memory - project decisions, session handoff, and the lessons layer: |
| C302 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | [memory.md](references/memory.md). |
| C303 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Resolve `<skill-dir>` as the directory containing this `SKILL.md` and invoke |
| C304 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | `python3 <skill-dir>/scripts/<name>.py`. Project data under `.specs/` stays relative to the |
| C305 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | project root; pass `--root` when cwd differs. A non-zero exit means STOP and fix. |
| C306 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | `validate_plan.py` runs the closure gate and guards the shape half against becoming what it |
| C307 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | replaced: it fails a criterion with no SHALL, an assumption with no chosen default, an `Observable` |
| C308 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | row whose landing is blank or whose `n/a` carries no reason, a `Landing` |
| C309 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | row with no literal shape or no rejected alternative, columns and types inside `Relations`, a |
| C310 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | `Surface` route with no statuses, and any section left blank rather than answered with |
| C311 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | `None - <why>`. `validate_checks.py` is the omission catcher: it fails a check with no proof, a |
| C312 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | coverage row whose declared size exceeds the members actually assigned, a missing swept dimension, |
| C313 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | and a missing profile line, and warns on a route the plan reviewed that no check mentions. |
| C314 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | `validate_verification.py` fails a PASS report that cites no `file:line`, records a surviving |
| C315 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | mutant, leaves an `Unproven` member, or was written by the author. |
| C316 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Skip a script only when no code-execution tool exists; then perform the same checks by reading |
| C317 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | the artifact and say once in chat that you are in the degraded path. |
| C318 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | `selftest.py` applies this skill's own discipline to its gates: it mutates a filled-in fixture |
| C319 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | set once per rule and requires every mutant to be killed, runs negative controls proving a |
| C320 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | profile-scoped gate does **not** fire below its profile, and smoke-runs every script shipped |
| C321 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | here - an unexercised script is where a crash hides, and the completion gate once exited 0 with |
| C322 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | nothing gated. Run it after editing a validator or a |
| C323 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | template - a validator that exits 0 on everything is decoration, one that exits 1 on everything |
| C324 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | makes `light` unusable, and only injection tells the two apart. The fixtures in |
| C325 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | `scripts/fixtures/` are also a complete worked example of a passing `standard` artifact set. |
| C326 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **One builder unless the estimate does not fit.** Pack whole slices - never split a slice - |
| C327 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | accumulating while the running estimate stays under the declared `budget` (default 150k |
| C328 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | tokens, from `wc -c` on the files each slice touches, divided by four). Prefer a cut where |
| C329 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | the surface changes. Write the intended split into `checks.md` under `## Handoff` with the |
| C330 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | arithmetic, after the checks exist and before any code: a number with its reason can be |
| C331 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | argued with, a bare number can only be trusted. |
| C332 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Then the gate, and only then: |
| C333 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | The estimate fits → one builder. Do not ask. Do not offer a spawn. |
| C334 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | The estimate exceeds the budget → **stop**. Do not start the implementation. Ask which mechanism to use, with both exits named: |
| C335 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **handoff** — cut at the surface boundary already written, batches sequential and only on green |
| C336 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **one builder** — stay, and accept compaction / context loss |
| C337 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | A slice that alone exceeds the budget was cut too coarsely - say so rather than splitting mid-outcome. That is not this ask. |
| C338 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Do not ask where to cut. The cut is logistics; the user's answer cannot be better informed |
| C339 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | than the arithmetic. Do not ask when it fits. Do not offer spawn at the start of a feature. |
| C340 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Record the chosen mechanism on the same `## Handoff` line before the first line of code. |
| C341 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Batches run sequentially and only hand off on green. The next builder reads `checks.md` and |
| C342 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | the **diff** of what landed, never a narrative summary. |
| C343 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | When the last batch returns green, the parent dispatches the Verifier in that same turn. |
| C344 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Do not ask. A builder never launches it. |
| C345 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | What else needs a decision is the profile, a live alternative in `Landing`, and anything |
| C346 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | the refuse-rather-than-guess gate caught. |
| C347 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | **Model tier**, only if the harness assigns a model per sub-agent: high reasoning for a |
| C348 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | core-domain slice and for writing the checks, faster for mechanical slices, mid-to-high for |
| C349 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | the Verifier - it designs mutations and reasons adversarially, so it is never the cheapest |
| C350 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | tier. Advisory only; no gate depends on it. |
| C351 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | In strict order: existing code and conventions, project docs, library documentation (Context7 |
| C352 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | where available), web search, then flag as uncertain. Never invent an API, a flag, a command |
| C353 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | or a behaviour. "I could not find documentation for this" always beats a plausible |
| C354 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | fabrication, because a fabrication propagates into the checks and then into a green test that |
| C355 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | Produce the artifact; do not narrate the phase. Lead with the verdict. State decisions |
| C356 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | definitively. Cut filler and mechanical hedging. Write the connectives in the language of the |
| C357 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | document - the section headings are a schema and stay in English, the prose follows the |
| C358 | T1 | `.cursor/skills/tlc-spec-lean/SKILL.md` | project, and identifiers are never translated. |
| C359 | T2 | `.claude/skills/harness-eval/references/GLOSSARY.md` | Harness-referenced document `.claude/skills/harness-eval/references/GLOSSARY.md` is an on-demand load target when linked from always-on rules or skills. |
| C360 | T2 | `.claude/skills/harness-eval/references/PROTOCOL.md` | Harness-referenced document `.claude/skills/harness-eval/references/PROTOCOL.md` is an on-demand load target when linked from always-on rules or skills. |
| C361 | T2 | `.claude/skills/harness-eval/references/claims.schema.json` | Harness-referenced document `.claude/skills/harness-eval/references/claims.schema.json` is an on-demand load target when linked from always-on rules or skills. |
| C362 | T2 | `.claude/skills/harness-eval/references/judge-prompts.md` | Harness-referenced document `.claude/skills/harness-eval/references/judge-prompts.md` is an on-demand load target when linked from always-on rules or skills. |
| C363 | T2 | `.cursor/skills/harness-eval/references/GLOSSARY.md` | Harness-referenced document `.cursor/skills/harness-eval/references/GLOSSARY.md` is an on-demand load target when linked from always-on rules or skills. |
| C364 | T2 | `.cursor/skills/harness-eval/references/PROTOCOL.md` | Harness-referenced document `.cursor/skills/harness-eval/references/PROTOCOL.md` is an on-demand load target when linked from always-on rules or skills. |
| C365 | T2 | `.cursor/skills/harness-eval/references/claims.schema.json` | Harness-referenced document `.cursor/skills/harness-eval/references/claims.schema.json` is an on-demand load target when linked from always-on rules or skills. |
| C366 | T2 | `.cursor/skills/harness-eval/references/judge-prompts.md` | Harness-referenced document `.cursor/skills/harness-eval/references/judge-prompts.md` is an on-demand load target when linked from always-on rules or skills. |
| C367 | T2 | `.cursor/skills/the-judge/references/comment-voice.md` | Harness-referenced document `.cursor/skills/the-judge/references/comment-voice.md` is an on-demand load target when linked from always-on rules or skills. |
| C368 | T2 | `.cursor/skills/the-judge/references/review-standards.md` | Harness-referenced document `.cursor/skills/the-judge/references/review-standards.md` is an on-demand load target when linked from always-on rules or skills. |
| C369 | T2 | `.cursor/skills/tlc-spec-lean/references/build.md` | Harness-referenced document `.cursor/skills/tlc-spec-lean/references/build.md` is an on-demand load target when linked from always-on rules or skills. |
| C370 | T2 | `.cursor/skills/tlc-spec-lean/references/checks.md` | Harness-referenced document `.cursor/skills/tlc-spec-lean/references/checks.md` is an on-demand load target when linked from always-on rules or skills. |
| C371 | T2 | `.cursor/skills/tlc-spec-lean/references/memory.md` | Harness-referenced document `.cursor/skills/tlc-spec-lean/references/memory.md` is an on-demand load target when linked from always-on rules or skills. |
| C372 | T2 | `.cursor/skills/tlc-spec-lean/references/plan.md` | Harness-referenced document `.cursor/skills/tlc-spec-lean/references/plan.md` is an on-demand load target when linked from always-on rules or skills. |
| C373 | T2 | `.cursor/skills/tlc-spec-lean/references/verify.md` | Harness-referenced document `.cursor/skills/tlc-spec-lean/references/verify.md` is an on-demand load target when linked from always-on rules or skills. |
| P001 | T0 | `AGENTS.md` | Run the project script `dev` when you need that workflow. |
| P002 | T0 | `AGENTS.md` | Run the project script `dev:api` when you need that workflow. |
| P003 | T1 | `.agents/skills/workflow-tips/SKILL.md` | Prefer clear variable names and small functions when writing code. |
| P004 | T1 | `.agents/skills/workflow-tips/SKILL.md` | Keep layers thin and delegate work to the appropriate lower layer. |
| P005 | T0 | `AGENTS.md` | Never commit secrets, API keys, or credentials into the repository; use environment configuration outside version control. |
| P006 | T0 | `AGENTS.md` | Known caveat: commands that pass locally can still fail in CI when they depend on machine-local env vars or secrets that are not present in the pipeline; prefer the project's documented CI entrypoint when validating. |

## Output

Write scores as a table: `| ID | Cost | Class | Evidence | Confidence | Trim suggestion |`

