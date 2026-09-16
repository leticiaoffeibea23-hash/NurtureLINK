# NurtureLink — Handoff to engineering (UI/UX + interaction spec)

**Artifact:** `NurtureLink.dc.html` — a fully clickable offline-first mobile prototype.
**Status:** UI/UX reference + interaction spec. **Not** production code. Backend, admin web back-office, on-device encryption, real nutrient engine, and DHIMS2 integration are out of this artifact's scope (see Master Spec v2.0 §3, §4, §6, §8).
**Design system:** AmaliTech Unified Experience DS (Dark Blue `#08283B` primary, Orange `#FF5A00` accent, Inter/Poppins).
**Blocking content gap:** all Dagbani strings (voice scripts + interface toggle) are AI drafts — must be reviewed by a native speaker / nutrition officer before user testing. Flagged in-app.

---

## 1. Screen inventory → spec mapping

| Screen | Purpose | Spec ref | Data (schema §7) | Endpoints (build) |
|---|---|---|---|---|
| Splash / Login (PIN + role) | Multi-user auth on shared device | §6.1 | `users` | `POST /auth/pin`, JWT/RBAC |
| Home (prioritised list) | Pre-visit prioritisation | §1.1, §5.1 | `clients`, `visits` | `GET /clients?rank=risk` |
| Register client | Consent + enrolment | §7.1 | `clients` (`consent_at`, `household_id`) | `POST /clients` |
| Client detail | Longitudinal trend, why-ranked, diet diversity | §1.1, §3A | `visits`, computed flags | `GET /clients/:id` |
| Visit capture (+ danger signs) | <60s visit entry; danger-sign trigger | §5.1, §3 | `visits` (`weight_kg`,`hb_g_dl`,`muac_mm`,`diet_recall`,`danger_signs`) | `POST /visits` (offline queue) |
| Feeding plan (editable + approve) | Deterministic basket + adequacy + rationale | §1.3B, §3.1 | `plans`, `foods`, `seasonal_availability` | `POST /plans` (on-device engine) |
| Voice note (player, delivery, record-own) | Local-language caregiver channel | §3B, §5.2 | `plans.voice_script`, `voice_pack_id` | audio pack bundle |
| Referral guardrail | Severe-case safety gate | §3 responsible-AI, §2.3 | `visits.danger_signs`, thresholds | — |
| Referrals list (post-referral tracking) | Last-mile follow-up | §2 (challenge 2) | new `referrals` table (see §3) | `POST /referrals`, `PATCH /referrals/:id` |
| Monthly tally (DHIMS2) | Auto-aggregated CHPS report | §4.5, §5.1 | aggregate of `visits` | `GET /reports/tally`, DHIMS2 Web API |
| Profile & device | Multi-profile, battery/storage/telemetry, sync policy, language | §6.1–6.4 | `telemetry_events` | telemetry flush w/ sync |
| Supervisor overview | District rollup | §4.1 | aggregates | `GET /district/overview` |

---

## 2. What the prototype fakes (replace with real implementation)

- **Prioritisation** is precomputed per demo client. Real: explainable risk score from `visits` trend (falling Hb, flat weight-for-age, low diet diversity) — deterministic, no black box.
- **Feeding plan foods + adequacy %** are hardcoded demo values. Real: deterministic basket selection over `foods` × `seasonal_availability` for the client's agro-zone/month, scored against WHO/IYCF targets using a West-African food-composition table.
- **Voice scripts** are static English + placeholder Dagbani. Real: templated script from selected plan (offline) → optional server LLM rephrase with output validation (§3.2). LLM never makes clinical decisions.
- **Sync / DHIMS2** is a UI state only. Real: push/pull sync gateway, versioned reference bundles, DHIMS2 tally payload.
- **PIN / row-level locking / encryption** are shown as copy + badges. Real: SQLCipher, per-user session, row-level draft locks (§6.1).
- **Battery/storage/telemetry numbers** are illustrative.

---

## 3. Acceptance criteria for the safety-critical logic

**Referral guardrail (must be data-driven):**
- Trigger referral (bypass counselling) when ANY: a danger sign is recorded; MUAC < 115 mm; Hb < 7 g/dL (severe anaemia); obstetric danger sign for pregnant clients.
- Guardrail is deterministic and worker-confirmable — worker issues the referral; system creates a `referrals` record and a follow-up flag; the case stays in the Referrals list until status = `seen`.
- `referrals` table (add to schema): `id`, `client_id`, `visit_id`, `reason`, `facility_id`, `status ('issued'|'seen')`, `issued_by`, `issued_at`, `seen_at`.

**Responsible-AI boundaries (§3):**
- AI is permitted ONLY for: (a) free-text recall → food-group parsing, (b) script rephrasing into local language. Both have deterministic fallbacks and must run through output validation.
- Every recommendation carries a plain-language "why". Worker approval is required before a plan is sent (prototype: "Approve & create voice note").
- Recommendations align to WHO growth standards, WHO anaemia thresholds, GHS/CHPS protocol.

**Offline & device (§6):**
- Writes queue locally and sync on connection; adaptive sync (heavy pulls only >30% battery or on power); storage cap 250 MB with auto-clear under 10% free; telemetry anonymised (PII stripped) and flushed with sync.

---

## 4. Interaction notes worth preserving
- Diet recall = 8 IYCF food groups; MDD threshold ≥5.
- Every screen paints from inline styles; navigation is a single `screen` state machine; sample data lives in the logic class (`seed()`, `PLANS`).
- Copy follows AmaliTech voice: sentence case, plain English, no emoji in product UI, dates as `12th Nov, 2026`.

---

## 5. Open items before user testing
1. Native-speaker Dagbani review (voice scripts + interface strings). **Blocking.**
2. Real pilot-district seasonal dataset + food-composition table.
3. At least one field conversation with a CHO/nutrition officer (per application draft's field-grounding note).
