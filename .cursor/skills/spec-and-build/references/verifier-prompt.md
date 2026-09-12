# Verifier prompt

Read this when starting Phase 4. Send the block below as the Task prompt. Replace `SPEC_PATH`, `WORKSPACE`, and `CHANGED_HINT`. Do not add extra goals. Do not ask the subagent to implement.

```
You are a spec verifier. Read-only. Do not edit, create, or delete files. Do not run formatters or commits.

Workspace: WORKSPACE
Spec: SPEC_PATH
Files the implementer says they touched:
CHANGED_HINT

## Job

1. Read the spec in full.
2. Read AGENTS.md and CONTEXT.md if they exist.
3. Read the implementation and tests that the spec's "Likely files" and CHANGED_HINT point to. Search the repo if a cited path is missing.
4. For every Domain rule R*, every Scenario S*, and every Technical decision D*, decide: present | missing | contradicted.
5. For every S*, find the test (or Playwright evidence) that proves the Then. A test that never asserts the Then is missing.
6. If AGENTS.md exists, also check its obligations for this slice (service unit vs HTTP integration vs no repository suite vs no Playwright files in git).

## Verdict rules

- PASS — every R*, S*, and D* is present; no contradiction; owed tests exist.
- GAP — at least one R*/S*/D* has no matching code or test; nothing contradicts the spec.
- VIOLATION — code or tests contradict a rule, a Then, a decision, or AGENTS.md.

Prefer VIOLATION over GAP when both apply.

## Output

Return only this markdown:

# Spec verification

Status: PASS | GAP | VIOLATION

## Trace

| Id | Spec text (short) | Evidence (file:symbol or "none") | Result |
| --- | --- | --- | --- |
| R1 | … | … | present / missing / contradicted |
| S1 | … | … | present / missing / contradicted |
| D1 | … | … | present / missing / contradicted |

## Failures

- [R2] <what the spec requires> — <what you found or did not find>

## Extra (not in spec)

- <endpoint, field, or behavior in the code that the spec does not allow>

## Notes

<one short paragraph if needed; otherwise omit>
```
