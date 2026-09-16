# NurtureLink — Application Pitch

> Offline-first nutrition decision support for CHPS Community Health Officers in rural Northern Ghana.
> Built for the **UNICEF AI for Nurturing Care Hackathon** (KOICA / MEST StartUp Lab) · Bootcamp: 26–28 August 2026, Tamale.

**GitHub:** <https://github.com/YakubuLute/nurturelink>
**Team:** Yakubu Lute (Technical Lead) · Leticia Offeibea (Health & Nutrition Domain)

---

## 1. The Problem

In Northern Ghana, **1 in 3 children under 5 is stunted**. Fewer than 4 in 10 receive a minimum acceptable diet (GDHS 2022: 26.4% nationally). Children eating fewer than 4 food groups are **nearly 4× more likely to be wasted**. In Savannah Region, **91.8% of neonatal deaths occurred in the first 7 days of life** (DHIMS-2, 2018–2022) — a window so tight that any tool arriving at the six-week postnatal visit is already too late. Food insecurity stands at **73.7% in Upper East Region**, the highest of the five northern regions. The Northern Region reported **100 institutional maternal deaths in 2023** — a ratio of 136.7 per 100,000 live births, well above the SDG 3.1 target of < 70.

Community Health Officers (CHOs) at CHPS compounds are the last-mile workers visiting 10–25 households per day. They have **no tool** for two critical tasks:

1. Seeing how a client's nutrition is **trending** across visits — not just today's isolated reading.
2. Knowing which **specific foods to recommend** that are nutritious, in season, affordable, and actually available in that community this month.

A field conversation with a working CHPS CHO (August 2026) confirmed the gap directly: they already use a 4+ food-group framework — staples, protein, fruits and vegetables, fats/oils — but must apply it from memory, generically, with no way to know which of those foods are abundant in that district *this month*, or whether *this particular client's* trend is improving or worsening. Generic advice ("eat more greens") fails poor households who cannot act on a list of foods they cannot find or afford.

> *NurtureLink adds no new measurements. It makes the data the CHO already collects actionable.*

---

## 2. The User

**A CHPS Community Health Officer (CHO)** in a rural Northern Ghana community.

- Visits 10–25 households per day on foot or by motorbike
- Carries a low-end Android phone (Android 8+, ~2 GB RAM)
- Network is intermittent or absent for hours at a time
- Serves caregivers whose primary language is Dagbani, not English
- Records weight, MUAC, haemoglobin, and dietary recall at each visit
- Currently has no way to see how a client's nutrition has changed over time

---

## 3. Our Solution

**NurtureLink** is a mobile app (React Native / Expo) that runs **fully offline** and does two things:

### A — Longitudinal nutrition record

Built from what the CHO already collects (weight, MUAC, Hb, dietary recall), the app shows each client's trend across visits and flags declining haemoglobin, flat weight, or low diet diversity — so the CHO knows who to prioritise and why.

### B — Seasonal affordable-food plan

For a flagged client, the app generates a feeding plan using foods that are in season, affordable, and locally available in that district this month — chosen to close the specific nutrient gap (iron and folate for an anaemic mother; energy and protein for a faltering child). The plan is delivered as a plain-language voice note in Dagbani that the caregiver keeps on any phone.

### Responsible AI design

The **CHO always makes the final decision** — the app surfaces evidence and a suggested plan; the worker confirms before the caregiver hears anything. The LLM (Claude Haiku) **never makes clinical decisions**. It only rephrases a deterministically generated plan into natural spoken language. If the LLM is unavailable, a template fallback produces the same output. **Severe cases bypass AI entirely and route to referral.** No client PII is sent to the LLM. Clinical thresholds are stored in versioned reference data, not hard-coded, so district nutrition officers can update guidance without a code release. Client data is governed by **Ghana's Data Protection Act, 2012 (Act 843)** — only data the CHO already records on paper is collected, purpose is limited to nutrition decision support, and consent is captured at registration.

A complete visit record takes **under 60 seconds of input**. The priority list and feeding plan are returned instantly from on-device data. The app subtracts planning work from the CHO's round; it adds none.

---

## 4. App Screenshots

> **For designer:** Screenshots taken on Android (Pixel 6, portrait). Crop to device frame.
> Save files as `docs/screenshots/NN-screen-name.png` and the placeholders below will resolve automatically.

---

### Screen 01 — Login

![Login screen](screenshots/01-login.png)

**What to capture:** Login screen with NurtureLink logo, phone number field, PIN field (4-digit numeric), "Sign in" button, "Try with sample caseload" demo button, and "Work offline" link at the bottom.

**Caption:** CHOs sign in with their registered phone number and a 4-digit PIN. The app works fully offline — the "Work offline" mode loads the last synced caseload from the encrypted on-device database.

---

### Screen 02 — Home · Caseload list

![Home screen showing prioritised caseload](screenshots/02-home-caseload.png)

**What to capture:** The home screen showing 5 clients in priority order. Two clients have an **Urgent** red badge (Amina Yakubu — declining Hb; Abdul Latif — severe MUAC + oedema referred). One has a **Follow up** orange badge (Rahimatu Issah — flat weight). Two have a **Stable** green badge (Zeinab Alhassan, Sadia Mohammed). Show the metric value (Hb / MUAC / weight) and trend arrow for each row.

**Caption:** The home screen ranks clients by clinical urgency. The CHO sees at a glance who needs attention today, what the key metric is, and how it is trending — without opening a single record.

---

### Screen 03 — Client detail · Amina Yakubu (declining Hb)

![Client detail showing declining haemoglobin trend](screenshots/03-client-amina-declining-hb.png)

**What to capture:** Amina Yakubu's profile screen. Show the visit history section with 3 visits: Hb 11.2 → 10.4 → 9.6 g/dL across June–July 2026. Show the red "Haemoglobin falling — anaemia risk" flag banner. Show the "Start visit" and "View plan" buttons.

**Caption:** The app surfaces the trend the CHO cannot see from a single paper record: Amina's haemoglobin has dropped steadily across three consecutive visits. The flag fires automatically and cannot be dismissed — it stays visible until the next visit shows improvement.

---

### Screen 04 — Feeding plan · Amina Yakubu

![Feeding plan screen with foods, adequacy bars, and voice note](screenshots/04-plan-amina.png)

**What to capture:** Amina's feeding plan. Show 4–5 food cards (Dawadawa, Moringa leaves / Zogale, Cowpea / Tuya, Dried small fish / Amani, Millet / Nyɔri). Show adequacy bars (Iron 88%, Folate 82%, Energy 91%). Show the voice note section with the Dagbani script preview. Show the "In season · July · Northern Savannah" season note at the top.

**Caption:** The plan is generated on-device in under 1 second from the client's flags, the current month, and the Northern Savannah seasonal food database. Every food is low-cost, available now, and chosen to close Amina's specific nutrient gaps. The Dagbani voice note can be played or sent to the caregiver.

---

### Screen 05 — New visit · recording form

![Visit recording form showing measurements and diet recall](screenshots/05-visit-form.png)

**What to capture:** The visit recording screen for a child client. Show the measurements section (Weight, Haemoglobin, MUAC inputs with placeholder text). Show the dietary recall food group chips (Grains, Legumes, Vitamin A veg/fruit, etc.) with 2–3 selected. Show the diet diversity score badge at the bottom of the dietary recall section (e.g. "3/8").

**Caption:** The visit form captures only data the CHO already records on paper. Numeric inputs have expected ranges — values outside normal bounds trigger a soft confirmation before saving. No new measurements are introduced.

---

### Screen 06 — Danger sign guardrail · referral route

![Referral guardrail screen after danger sign detected](screenshots/06-referral-guardrail.png)

**What to capture:** The referral guardrail screen shown after saving a visit with a severe finding (MUAC 108 mm or bilateral oedema selected). Show the red alert header, the reason ("MUAC 108 mm — below the 115 mm threshold"), the "Issue referral to Tamale West Hospital" button, and the note explaining that no feeding plan will be generated.

**Caption:** When MUAC falls below 115 mm, haemoglobin below 7 g/dL, or any danger sign is recorded, the app blocks the feeding plan entirely and routes to referral. This is a hard guardrail — it cannot be bypassed. The LLM is not called for severe cases.

---

### Screen 07 — Referrals list

![Referrals list showing active and confirmed referrals](screenshots/07-referrals-list.png)

**What to capture:** The referrals tab showing Abdul Latif Mahama's active referral (red "Issued" badge, "Tamale West Hospital", referral reason). Show the "Confirm seen" button. If possible show the confirmation modal with outcome field and follow-up date picker open.

**Caption:** Every referral issued is tracked. When the CHO confirms the client reached the facility, they record the outcome and a follow-up date. This closes the loop that paper referral slips leave open.

---

### Screen 08 — Register new client

![Client registration form showing ANC fields for pregnant woman](screenshots/08-register-pregnant.png)

**What to capture:** Step 2 of the registration form for a pregnant woman. Show the ANC fields: LMP date picker, Expected delivery date (auto-calculated), ANC folder number, Gravida, Parity, and the caregiver name and relationship fields. Show the community picker with "Kukuo" selected.

**Caption:** Registration captures the clinical identifiers CHPS staff already use on paper: ANC folder number, CWC card number, gravida, parity, and LMP. All date fields use native date pickers — no manual date typing. Consent is recorded before any data is saved.

---

## 5. What Is Built

The following features are fully implemented and testable in the demo caseload today:

### Core clinical flows

- [x] Client registration — child and pregnant woman types, all CHPS clinical fields (ANC#, CWC#, gravida, parity, LMP, EDD, caregiver)
- [x] Visit recording — client-type-conditional form (pregnant fields vs child fields vs newborn fields)
- [x] Dietary recall — 8 WHO IYCF food groups, diet diversity score (0–8)
- [x] Danger sign checklist — 8 canonical codes aligned with WHO/GHS (bilateral oedema, convulsions, heavy bleeding, severe headache, etc.)
- [x] Soft range validation — unusual clinical values (e.g. MUAC 40 mm) trigger a confirmation alert, not a hard block
- [x] Vitamin A supplementation tracking — dose shown by age group (100,000 IU under 12 mo; 200,000 IU over 12 mo)
- [x] Newborn assessment section — cord condition, jaundice, breastfeeding initiation

### Flags and risk logic

- [x] Clinical thresholds read from reference bundle (not hardcoded) — versioned, auditable, updatable without a code release
- [x] Severe-case guardrail — MUAC < 115 mm, Hb < 7 g/dL, or any danger sign → `ReferralRequired`, plan generation blocked
- [x] Watch flags — MUAC 115–124 mm, Hb below watch threshold → `watch` severity, plan generated with flag context

### Recommendation engine

- [x] Deterministic on-device engine — pure function, no network, no randomness; same input always returns same output
- [x] Seasonal food selection — Northern Savannah availability data (12 foods × 12 months)
- [x] Nutrient gap targeting — iron, folate, energy, protein, Vitamin A, zinc against WHO/IYCF targets
- [x] Affordability filtering — `staple_cheap` / `market` / `premium` ceiling
- [x] Rationale trail — every food selection has an auditable reason array
- [x] 50+ passing unit tests covering every nutrient gap profile × season × severity combination

### Plan display

- [x] Food cards with local Dagbani names, cost tier badge, and reason text
- [x] Nutrient adequacy bars (% of WHO daily target met)
- [x] Voice script — English and Dagbani templates generated from plan data
- [x] Plan pre-seeded for demo clients (no visit required to see a real plan)

### Referrals

- [x] Referral issue — client marked referred, referral record created with reason and flag codes
- [x] Referral confirmation — outcome field, confirmation source, follow-up date picker
- [x] Emergency sync triggered on referral issue (highest priority outbox item)

### Infrastructure

- [x] Offline-first — all reads from SQLite; writes to SQLite first, queued in outbox for sync
- [x] SQLCipher at-rest encryption — 256-bit key generated per device, stored in Expo SecureStore
- [x] Outbox-based sync — idempotent push/pull with UUID primary keys
- [x] Reference bundle versioning — foods, thresholds, nutrient targets, seasonal data all versioned together
- [x] JWT authentication — access token (15 min) + refresh token flow
- [x] PIN-based login (4-digit numeric) aligned with CHO device usage patterns
- [x] Sync screen — battery, storage, last sync time, pending records counter
- [x] Bottom tab bar — Home, Referrals (badge), Sync, Profile

### Backend

- [x] Express.js API — auth, clients, visits, flags, referrals, sync push/pull, reference bundle endpoints
- [x] Prisma schema — all core and reference tables, migrations, seed data
- [x] Pilot district seed — 12 Northern Savannah foods, 12-month seasonal availability, 6 WHO clinical thresholds, 5 demo clients with 13 visit records, referral

---

## 6. What Is Left for Bootcamp (26–28 August 2026)

### Day 1 — Lock scope and data

- [ ] Validate food list and clinical thresholds with a working CHO or nutrition officer (Leticia's network)
- [ ] Record 5–10 Dagbani audio phrases for the voice note (needs a native Dagbani speaker)
- [ ] Replace demo affordability tiers with real community price benchmarks from field input
- [ ] Finalise pilot district (likely Sagnarigu Municipal or Tamale Metro)

### Day 2 — Strengthen the engine and sync

- [ ] Wire voice playback to real audio files (currently text script displayed)
- [ ] Complete pull sync — server → device for reference bundle updates
- [ ] Build conflict flag UI for concurrent edit cases (last-write-wins is implemented; UI is not)
- [ ] Longitudinal trend chart on client detail screen (data exists; chart not rendered)

### Day 3 — Polish and demo path

- [ ] End-to-end demo path rehearsal: login → caseload → visit → plan → voice note → referral
- [ ] DHIMS2-compatible export endpoint (schema aligned; serializer not wired)
- [ ] Final pitch deck and 2-minute demo video

---

## 7. Future Plans (post-bootcamp)

- **Multi-district expansion** — add agro zones, seasonal data, and audio packs for Upper West, Upper East, North East, and Savannah regions
- **DHIMS2 integration** — live export of visit and flag data to Ghana Health Service district system
- **SMS caregiver delivery** — send voice note as a link via SMS so caregivers receive it on any phone
- **Supervisor dashboard** — district-level nutrition heat map; CHO coverage and caseload analytics
- **Nutrition officer admin** — web back-office for curating food data, seasonal matrices, and clinical thresholds without a code release
- **Field validation study** — structured observation with real CHOs in Sagnarigu to measure counselling time, plan recall, and 3-month diet diversity change
- **Android release** — EAS build targeting Android 8+ devices used by GHS field staff

---

## 8. Team

See full bios in [docs/team-introduction.md](team-introduction.md).

| Name | Role | Background |
| --- | --- | --- |
| Yakubu Lute | Technical Lead | Senior Full-Stack Engineer, Amalitech & mPedigree Network (health-tech). Born Tumu, Upper West Region. 7+ years production mobile, web, and backend. |
| Leticia Offeibea | Health & Nutrition Domain | BSc Health Information Management. Research Assistant, Social Determinants of Health. USAID Ghana National Malaria Elimination Programme field experience. |

**UNICEF criteria met:** female team member, technology + health domain expertise, direct connection to the target geography (Upper West Region), responsible AI architecture.

---

*NurtureLink — Offline-first nutrition decision support for CHPS Community Health Officers in Northern Ghana.*
*UNICEF AI for Nurturing Care Hackathon · KOICA / MEST StartUp Lab · August 2026.*
