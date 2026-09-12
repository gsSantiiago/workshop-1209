---
name: spec-and-build
description: Plans work with the user, writes a Given/When/Then spec covering every domain rule and technical decision, implements against that spec, then launches a verifier subagent to check the result. Use when the user asks to plan, spec, write a spec, planejar, criar spec, given/when/then, start a roadmap item, or build a feature from a blank slate. Do not use for one-line fixes, commit or PR-only requests, or when the user only wants an explanation of existing code.
license: CC-BY-4.0
metadata:
  author: Waldemar Neto
  version: 1.0.0
---

# Spec and Build

Turn a piece of work into a written contract, then build only what the contract allows. The spec is the source of truth. Code that is not implied by a rule, a scenario, or a technical decision is out of scope.

Match the user's language in conversation. Write the spec, code identifiers, and domain terms in the project's ubiquitous language (English in this repo).

## Route the request

| User intent | Start at |
| --- | --- |
| Plan / spec / roadmap item / new feature | Phase 1 |
| Spec already on disk, implement it | Phase 3 (read the spec first; if a required section is empty, go back to Phase 1 for that gap only) |
| Spec + code exist, only validate | Phase 4 |
| Spec only, do not implement | Stop after Phase 2 confirmation |

Never skip the spec file. If the user says "just implement", write the spec with marked assumptions, get a yes, then implement.

## Phase 1 — Discover and settle doubts

Read before asking: `CONTEXT.md`, `AGENTS.md`, `ROADMAP.md` when they exist. Then explore the closest existing resource (routes / services / repositories / tests / screens) so questions are about undecided behavior, not about what the code already does.

If `~/.agents/skills/domain-modeling/SKILL.md` exists and the work introduces or changes a domain term, follow it: challenge synonyms against `CONTEXT.md`, write new terms there as they crystallise, and do not put implementation into `CONTEXT.md`.

Ask **one question at a time**. Each question includes your recommended answer and why. Wait for the reply. Do not dump a questionnaire. If the codebase already answers it, do not ask.

Cover, in this order, only what is still open:

1. Goal and actor (who does this, what changes in the world)
2. In scope vs out of scope
3. Domain rules (invariants, uniqueness, who may do what, what is forbidden)
4. Outcome-changing branches (happy path, validation, conflict, not-found, unauthorized)
5. HTTP or UI contract if the work has a surface
6. Technical decisions that bind the implementation (layering, storage, auth, error shape)

Stop Phase 1 when all of these are true:

- Every domain rule is a testable sentence (yes/no, no "usually")
- Every branch that changes the outcome has a scenario id reserved
- Technical decisions that affect the contract are chosen
- The user has confirmed shared understanding (ask that as the last question)

## Phase 2 — Write the spec

Read [references/spec-template.md](references/spec-template.md) now and write `docs/specs/<kebab-slug>.md`. Create `docs/specs/` if needed. Reuse an existing spec path when the user named one.

Rules for the spec:

- Number domain rules `R1`, `R2`, … and scenarios `S1`, `S2`, … and decisions `D1`, `D2`, …
- Every scenario is Given / When / Then. The Then is an observable outcome (status, body, persisted state, or UI).
- Every scenario cites the rules it proves (`Covers: R1, R3`).
- Every outcome-changing branch has a scenario. If you cannot write one, the rule is still fuzzy — go back to Phase 1.
- Technical decisions record the choice, the rejected alternative, and why. No code dumps.
- Test obligations follow `AGENTS.md` when it exists: service unit for every branch that changes the outcome; HTTP + real DB for the contract and unique indexes; no repository suite; Playwright MCP for screens, not a suite in git.
- Do not invent rules to make the spec look complete. Missing and explicit is better than a guessed invariant.

Show the path and a short summary. Do not implement until the user approves the spec.

If the user rejects part of it, edit the spec and re-confirm. The approved file is the contract.

## Phase 3 — Implement

Implement only what the approved spec states. Follow `AGENTS.md` layering and test rules when they exist.

- Name tests so they map to scenario ids (`S1`, `S2`) or quote the Then.
- If implementation uncovers a missing rule, stop coding, update the spec, ask the user, then continue.
- Do not "improve" scope (extra endpoints, extra fields, extra roles).
- If a screen changed, exercise the flow with Playwright MCP before calling Phase 3 done.

When the implementation and the repo tests you owe are green, go to Phase 4. Do not self-declare done.

## Phase 4 — Verifier subagent

Launch a **new** `generalPurpose` subagent with `run_in_background: false`. Do not resume an old agent. Do not verify only yourself — the point is a second reader with the spec as the only contract.

Read [references/verifier-prompt.md](references/verifier-prompt.md) now. Use it as the prompt body. Fill every placeholder:

- `SPEC_PATH` — the spec file
- `WORKSPACE` — repo root
- `CHANGED_HINT` — files and tests you touched (paths only)

The subagent is read-only. If it edits files, discard those edits.

### Verdict

| Status | Meaning | What you do |
| --- | --- | --- |
| `PASS` | Every `R*`, `S*`, and `D*` is present and consistent | Tell the user it matches the spec. If `ROADMAP.md` has this item, mark it done. |
| `GAP` | Spec requires something that is missing | Fix the gap. Re-run Phase 4 once. |
| `VIOLATION` | Code contradicts a rule, scenario, or decision | Fix the violation. Re-run Phase 4 once. |

After one re-run, if it is still not `PASS`, stop and show the remaining findings. Do not loop silently.

If the subagent fails to start, say so and run the same checklist yourself from `verifier-prompt.md`. Label that result `SELF-CHECK`, not `PASS`.

## Do not

- Start coding during Phase 1 or 2
- Ask questions the repo already answers
- Use Portuguese synonyms for domain terms when `CONTEXT.md` forbids them
- Treat a green integration test as a substitute for the service suite
- Add Playwright files to git
- Reopen language or architecture already decided in `CONTEXT.md` / `AGENTS.md`

## Examples

### Example 1 — New roadmap slice

User says: "vamos planejar Job"

Actions: read glossary and roadmap; ask who creates a Job and whether it holds quantity; write `docs/specs/job.md` with rules and GWT; wait for approval; implement the trio + tests; launch the verifier.

Result: spec on disk, code matches, verifier `PASS`.

### Example 2 — Spec already approved

User says: "implementa docs/specs/job.md"

Actions: skip grilling unless a section is empty; implement; verifier.

Result: same as Phase 3–4.

### Example 3 — Discovery finds a contradiction

User says "partial cancellation" but code cancels the whole Order.

Actions: surface the contradiction as the next question, with a recommended term; update `CONTEXT.md` only after they pick; then write the spec.

## Troubleshooting

**User answers several things at once.** Extract what is decided, ask only the next unset item.

**User wants to skip questions.** Write the spec with an `Assumptions` list. Each assumption is a proposed `R*` or `D*`. Confirm before Phase 3.

**Verifier flags a rule the user later dropped.** Edit the spec first, then the code, then re-verify. Do not leave the spec lying.

**Work is a screen-only copy change.** Still write a short spec (one rule, one scenario). Phase 4 still runs; Playwright is the Then.
