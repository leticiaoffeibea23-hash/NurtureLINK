# NurtureLink — Prototype improvement backlog

> ✅ All items implemented in `NurtureLink.dc.html` (this pass). Kept as a record.

Recommendations from the design critique, ordered for implementation one after the other.
Each item notes *what falls short today* and *what to build*.

---

## Priority 1 — Make the AI/decision-support layer visible & accountable

- [x] **1.1 Explainable prioritisation ("why ranked").** Home list shows priority chips but never *why* a client is #1. Add a "Why this ranking" panel on the client detail (falling Hb / flat weight / low diet diversity, as an explainable flag — not a black box).
- [x] **1.2 Worker override & approval.** The worker is currently a passive tapper. Add: edit plan, swap a food, regenerate the counselling script, and an explicit **Approve before sending** step. Surface "AI-suggested · worker-approved".
- [x] **1.3 Fallback indicator.** Show when the plan/script came from the on-device deterministic template vs. the server AI enrichment (offline = template; online = enriched).

## Priority 2 — Core field workflows that are missing

- [x] **2.1 Register a new client/household.** No way to add a client today. Build consent capture, type (pregnant/child), name, DOB/EDD, household link.
- [x] **2.2 Persistent referral record.** Issuing a referral only fires a toast. Create a referral record that persists on the client, sets a follow-up flag, and appears in a "Referrals" view.
- [x] **2.3 Post-referral / last-mile follow-up.** Track referred clients until confirmed seen (spec's last-mile guardrail).

## Priority 3 — Offline, sync & multi-user depth

- [x] **3.1 Multi-user PIN profiles.** Shared compound device — each worker logs in; drafts locked to their session (row-level).
- [x] **3.2 Per-item sync state & conflict handling.** Replace the single banner with per-visit sync status (pending / synced / conflict).
- [x] **3.3 Battery-, storage- & network-aware sync.** Adaptive sync (>30% battery / on power), storage quota guardrail, telemetry queue surfaced in a diagnostics/settings screen.

## Priority 4 — Voice / caregiver channel

- [x] **4.1 Feature-phone vs smartphone paths.** Make the two delivery routes behave differently (Bluetooth/offline vs WhatsApp/peer-to-peer), with a delivery confirmation.
- [x] **4.2 Record-your-own-voice option.** Let the worker record a custom local-language note in addition to the generated one.
- [x] **4.3 Real Dagbani review.** Current Dagbani script is a placeholder — needs a native speaker / nutrition officer review before it's shown to users.

## Priority 5 — Bilingual, states & accessibility

- [x] **5.1 Full bilingual chrome.** Today only the transcript toggles; extend EN/Dagbani to app labels, not just the voice note.
- [x] **5.2 Complete empty/error/edge states.** Add "no visits yet", "offline — can't generate right now", low-storage warning, and referral-list empty state (only search-empty exists now).
- [x] **5.3 Field accessibility.** Larger tap targets throughout, large-text mode, high-contrast/sunlight-readable option for glove & outdoor use.

---

*Order of attack next session: 1.1 → 1.2 → 2.1 → 2.2. These deliver the "AI earns its place, worker stays responsible" story the spec leads with.*
