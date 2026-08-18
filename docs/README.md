# Docs, start here

**Step 1: everyone reads `00-FOUNDATIONS-READ-FIRST.md`.** No exceptions, no skipping. 30 to 40 minutes. It is the shared knowledge every team member needs to build correctly and to survive Q&A.

**Step 2:** read the root `README.md`, then **only your own brief** below. Do not read all six, you do not have time.

| Person | Brief | Branch | Folder |
|---|---|---|---|
| 1 | `person-1-core-fl.md` | `feat/core-fl` | `core/` |
| 2 | `person-2-ui-hospital.md` | `feat/ui-hospital` | `ui-hospital/` |
| 3 | `person-3-ui-server.md` | `feat/ui-server` | `ui-server/` |
| 4 | `person-4-attack.md` | `feat/attack-console` | `ui-attacker/`, `attack/` |
| 5 | `person-5-results-surveillance.md` | `feat/surveillance` | `ui-surveillance/`, `results/` |
| 6 | `person-6-pitch.md` | `feat/pitch` | `pitch/` |

Claude Code prompts for every person: `CLAUDE_CODE_PROMPTS.md`.

---

## Rules that apply to everyone

1. **Only touch your own folder.** `contract/` is frozen. If you must change it, announce it to the whole team first.
2. **Build against the mock server.** `python contract/mock_server.py`, connect to `ws://localhost:8765`. Never wait for someone else's code.
3. **PR early and often.** Incomplete is fine. One giant merge at midnight is not.
4. **Use the colour tokens** in `contract/events.md`. All five screens must look like one product.
5. **No em dashes anywhere**, in UI text, docs, or the deck.
6. **Do not overclaim.** Read section 3 of the root README. If you write a sentence in the UI or deck that claims more than we can prove, delete it.

## Timeline

| Time | Milestone |
|---|---|
| T+0 | Repo cloned, brief read, Claude Code prompt fired |
| T+3h | First PR from everyone, however rough |
| T+6h | Second merge window, all UIs connecting to mock |
| T+8h | Integration on main with real core, 90 minutes reserved |
| T+9.5h | Full rehearsal, screen recording made |
| After | Only polish. No new features. |

## Everyone owns a knowledge lane

In Q&A, judges will ask any of you anything. Each person must be able to defend their lane without help, and know one sentence about everyone else's.

| Person | Lane |
|---|---|
| 1 | Federated architecture, Flower, aggregation, rounds |
| 2 | Node-side workflow, what a hospital actually sees and does |
| 3 | Non-IID, FedProx vs FedAvg, why averaging breaks |
| 4 | Threat model, gradient inversion, membership inference, DP |
| 5 | Privacy-utility tradeoff, epsilon, surveillance aggregation |
| 6 | Problem, impact, DPDP Act, positioning vs existing frameworks |
