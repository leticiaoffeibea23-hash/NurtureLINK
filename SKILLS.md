# SKILLS.md — NurtureLink Build Reference

Complete technical and domain knowledge reference for building NurtureLink. Read alongside `CLAUDE.md` (conventions and constraints) and the specs in `docs/specifications/`.

---

## Table of Contents

1. [Domain Knowledge — Ghana Health Context](#1-domain-knowledge)
2. [CHPS Workflow Integration](#2-chps-workflow-integration)
3. [Clinical Protocols and Thresholds](#3-clinical-protocols-and-thresholds)
4. [Full Data Schema](#4-full-data-schema)
5. [Recommendation Engine Algorithm](#5-recommendation-engine-algorithm)
6. [Offline-First and Sync Protocol](#6-offline-first-and-sync-protocol)
7. [AI Integration — Full Specification](#7-ai-integration)
8. [Voice Delivery System](#8-voice-delivery-system)
9. [Admin Web Back-Office](#9-admin-web-back-office)
10. [DHIMS2 Interoperability](#10-dhims2-interoperability)
11. [Security and Privacy](#11-security-and-privacy)
12. [Hardware and Device Constraints](#12-hardware-and-device-constraints)
13. [UNICEF Challenge Area Mapping](#13-unicef-challenge-area-mapping)

---

## 1. Domain Knowledge

### 1.1 Why This Exists

In Northern Ghana, roughly a third of children aged 6–23 months are stunted and fewer than 4 in 10 receive a minimum acceptable diet. Children eating fewer than 4 food groups are nearly 4× more likely to be wasted. The Northern Region reported 100 institutional maternal deaths in 2023 (ratio: 136.7 per 100,000 live births) against the national SDG 3.1 target of < 70 per 100,000 by 2030.

The health worker has no tool for two critical tasks:
1. Seeing how a client's nutrition is trending across visits (not just point-in-time readings).
2. Knowing which specific foods to recommend that are nutritious, in season, affordable, and locally available today.

Generic advice ("eat more greens") fails because the right foods change by season and these are poor households who cannot act on a list of foods they cannot find or afford.

### 1.2 The System — CHPS

**CHPS** = Community-based Health Planning and Services. The Ghanaian primary healthcare delivery system in rural areas.

- **CHO** = Community Health Officer. The primary user. Covers a zone of scattered rural households. Carries a smartphone, frequently offline.
- **CHPS compound** = The local health post serving one zone.
- **DHIMS2** = District Health Information Management System (version 2). Ghana's national health information system. Currently paper-based at the CHPS level for nutrition tallies.
- **TTFPP** = Targeted Therapeutic Feeding Programme — the intervention pathway for severe acute malnutrition.

### 1.3 What the CHO Already Measures

At each client visit, the CHO collects:
- **Weight (kg)** — plotted against WHO weight-for-age growth standards for children.
- **Haemoglobin / Hb (g/dL)** — anaemia indicator for pregnant women.
- **MUAC (mm)** — Mid-Upper Arm Circumference. Acute malnutrition indicator for children.
- **Dietary recall** — a verbal account of what was eaten in the last 24–48 hours, categorised into food groups.

NurtureLink adds **no new measurements**. It makes the data the CHO already collects actionable.

### 1.4 Key Nutrition Concepts

**Minimum Acceptable Diet (MAD):** WHO/UNICEF composite indicator for children 6–23 months. Requires meeting both minimum meal frequency and minimum dietary diversity (≥ 4 of 8 food groups).

**8 IYCF Food Groups:**
1. Grains, roots, and tubers
2. Legumes and nuts
3. Dairy products (milk, yogurt, cheese)
4. Flesh foods (meat, fish, poultry, organ meats)
5. Eggs
6. Vitamin A–rich fruits and vegetables
7. Other fruits and vegetables
8. Breastmilk (for children < 24 months)

**Diet Diversity Score (DDS):** count of distinct food groups consumed. Target: ≥ 4 for MAD.

**Nutrient Gaps (common in Northern Ghana):**
- Pregnant women: iron (anaemia), folate (neural tube), energy.
- Children 6–23 months: iron, vitamin A, zinc, protein, energy (diet diversity).
- Children 24–59 months: iron, protein, energy.

**Affordability:** Modelled as tiers (`staple_cheap` | `market` | `premium`), never as currency amounts. Per GHS guidance, per-item price tracking is not useful at the CHPS level. Seasonal availability is the real constraint.

---

## 2. CHPS Workflow Integration

### 2.1 How the App Fits the CHO's Day

| Time | CHO Action | NurtureLink |
|---|---|---|
| Start of day | Review today's visit list | Pre-sorted priority list by risk score |
| At household | Greet, take measurements | < 60 sec data entry (numeric fields + tap-selectors) |
| During visit | Counsel on nutrition | View flags, generate plan, review rationale |
| Play/share | Hand guidance to caregiver | Play local-language voice note, or share via WhatsApp/Xender |
| Severe case | Route to referral | Referral guardrail blocks counselling, prompts referral |
| End of month | Submit DHIMS2 tally | Auto-generated tally summary from digital entries |

### 2.2 Double-Data-Entry Problem

The CHO is currently required to record visits in a paper register AND later aggregate tallies for DHIMS2 reporting. NurtureLink must eliminate, not add to, this burden. The value exchange: enter data digitally once → receive a monthly tally automatically. This is the adoption hook.

### 2.3 Voice Asset Transfer to Caregivers

The caregiver often has a feature phone and is low-literacy. Three transfer methods:

1. **In-person playback** (primary): CHO plays the voice note through the phone speaker during the visit.
2. **Bluetooth push** (offline): direct device-to-device transfer for feature phones.
3. **WhatsApp/Xender share** (online/peer-to-peer): share the audio file if the caregiver has a smartphone.

No app or data connection required on the caregiver's device.

---

## 3. Clinical Protocols and Thresholds

All thresholds are sourced from WHO/IYCF/GHS references and stored in the `clinical_thresholds` reference table — never hard-coded.

### 3.1 Severity Classification

**For children (MUAC):**
| MUAC | Severity | Action |
|---|---|---|
| ≥ 125 mm | OK / Green | Proceed to counselling |
| 115–124 mm | Watch / Yellow | Flag; counsel with extra emphasis |
| < 115 mm | Severe / Red | **Referral required — no home plan** |

**For pregnant women (Hb):**
| Hb (g/dL) | Severity | Action |
|---|---|---|
| ≥ 11.0 | OK / Green | Proceed to counselling |
| 8.0–10.9 | Watch / Yellow | Flag; iron/folate emphasis |
| 7.0–7.9 | Moderate | Flag; counsel + reinforce supplement |
| < 7.0 | Severe / Red | **Referral required — no home plan** |

**Obstetric danger signs** (any present → referral required):
- Severe headache or visual disturbance
- Severe abdominal pain
- Heavy vaginal bleeding
- Convulsions / loss of consciousness
- Difficulty breathing at rest
- Baby not moving (third trimester)

**Weight-for-age (children):**
| Z-score | Classification |
|---|---|
| ≥ −1 SD | Normal |
| −2 to −1 SD | Watch |
| −3 to −2 SD | Moderately underweight |
| < −3 SD | Severely underweight — referral |

### 3.2 Prioritisation Flags

The app computes a flag per client after each visit:

| Flag | Signal |
|---|---|
| `FALLING_HB` | Hb decreased by ≥ 0.5 g/dL vs. previous visit |
| `FLAT_WEIGHT` | Weight gain < expected trajectory for 2+ consecutive visits |
| `LOW_DIVERSITY` | DDS < 4 in latest dietary recall |
| `DANGER_SIGNS` | Any obstetric danger sign present |
| `SEVERE_MUAC` | MUAC < 115 mm |
| `SEVERE_ANAEMIA` | Hb < 7.0 g/dL |

Flags drive the priority-sorted follow-up list. Severe flags always appear at the top and block plan generation.

### 3.3 Nutrient Targets (WHO/IYCF)

Stored in `nutrient_targets` reference table:

| Profile | Nutrient | Daily Target |
|---|---|---|
| Pregnant | Iron | 27 mg |
| Pregnant | Folate | 600 µg DFE |
| Pregnant | Energy | 2340 kcal |
| Child 6–23m | Iron | 11 mg |
| Child 6–23m | Vitamin A | 400 µg RAE |
| Child 6–23m | Zinc | 3 mg |
| Child 6–23m | Protein | 13 g |
| Child 24–59m | Iron | 7 mg |
| Child 24–59m | Protein | 19 g |
| Child 24–59m | Energy | 1350 kcal |

---

## 4. Full Data Schema

### 4.1 PostgreSQL (server-authoritative) — also mirrored in on-device SQLite

```sql
-- USERS
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('system_admin', 'district_admin', 'CHO', 'nutrition_officer', 'supervisor')) NOT NULL,
    facility_id UUID REFERENCES facilities(id),
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL
);

-- FACILITIES (CHPS compounds / zones)
CREATE TABLE facilities (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    region TEXT NOT NULL,
    agro_zone_id UUID REFERENCES agro_zones(id),
    geo JSONB,          -- { lat, lng }
    active BOOLEAN DEFAULT TRUE
);

-- HOUSEHOLDS
CREATE TABLE households (
    id UUID PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES facilities(id),
    label TEXT NOT NULL,     -- descriptive name/label for the household
    community TEXT NOT NULL,
    geo JSONB,               -- optional
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- CLIENTS (mothers or children)
CREATE TABLE clients (
    id UUID PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households(id),
    type TEXT CHECK (type IN ('pregnant', 'child')) NOT NULL,
    name TEXT NOT NULL,
    dob DATE,                -- children
    edd_gestation TEXT,      -- pregnant: estimated due date or gestation weeks
    sex TEXT CHECK (sex IN ('M', 'F', 'unknown')),
    consent_at TIMESTAMPTZ NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ
);

-- VISITS (append-only clinical record)
CREATE TABLE visits (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id),
    user_id UUID NOT NULL REFERENCES users(id),
    visited_at TIMESTAMPTZ NOT NULL,
    weight_kg NUMERIC(4,2),
    hb_g_dl NUMERIC(3,1),       -- mothers only
    muac_mm NUMERIC(4,1),       -- children only
    diet_recall JSONB NOT NULL,  -- ["grains", "legumes", "eggs", ...]
    danger_signs JSONB,          -- array of present danger sign codes
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ
);

-- FLAGS (derived, computed after each visit)
CREATE TABLE flags (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id),
    visit_id UUID NOT NULL REFERENCES visits(id),
    severity TEXT CHECK (severity IN ('ok', 'watch', 'refer')) NOT NULL,
    reasons JSONB NOT NULL,     -- array of flag codes with values
    computed_at TIMESTAMPTZ NOT NULL,
    reference_bundle_version TEXT NOT NULL  -- version used to compute
);

-- PLANS (generated feeding plans)
CREATE TABLE plans (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id),
    visit_id UUID NOT NULL REFERENCES visits(id),
    season_month INTEGER NOT NULL,
    district TEXT NOT NULL,
    target_nutrients JSONB NOT NULL,   -- { iron: true, folate: true, ... }
    foods JSONB NOT NULL,              -- [{ id, name, local_name, why, tier }]
    adequacy JSONB NOT NULL,           -- { iron: 0.85, folate: 0.72, ... }
    rationale JSONB NOT NULL,          -- [{ food_id, reasons: ["in_season", "closes_iron_gap"] }]
    voice_script TEXT,                 -- populated by AI enrichment or template
    voice_pack_id UUID REFERENCES voice_packs(id),
    ai_enriched BOOLEAN DEFAULT FALSE,
    reference_bundle_version TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL
);

-- REFERRALS
CREATE TABLE referrals (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id),
    visit_id UUID NOT NULL REFERENCES visits(id),
    reason TEXT NOT NULL,
    flag_codes JSONB NOT NULL,
    facility_to TEXT,
    status TEXT CHECK (status IN ('issued', 'in_transit', 'arrived', 'outcome_good', 'outcome_poor', 'lost_to_follow_up')) DEFAULT 'issued',
    queued_offline BOOLEAN DEFAULT TRUE,
    issued_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ
);

-- AUDIT LOG (server only)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,        -- insert | update | delete
    change_summary JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);
```

### 4.2 Reference Tables (read-only on device, managed via Admin)

```sql
-- AGRO ZONES (groupings of districts with similar seasonal calendars)
CREATE TABLE agro_zones (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    districts JSONB NOT NULL    -- array of district names
);

-- FOODS (master food composition list)
CREATE TABLE foods (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,                    -- English canonical name
    local_names JSONB NOT NULL,            -- { "dagbani": "zogale", "mampruli": "..." }
    food_group TEXT NOT NULL,              -- one of the 8 IYCF food groups
    nutrients JSONB NOT NULL,              -- per standard serving: { iron_mg, folate_ug, protein_g, energy_kcal, vit_a_ug_rae, zinc_mg }
    affordability_tier TEXT CHECK (affordability_tier IN ('staple_cheap', 'market', 'premium')) NOT NULL,
    storable BOOLEAN DEFAULT FALSE,        -- can be dried/stored without refrigeration
    garden_wild BOOLEAN DEFAULT FALSE,     -- available from kitchen garden or wild collection
    active BOOLEAN DEFAULT TRUE
);

-- SEASONAL AVAILABILITY (per agro-zone, per month)
CREATE TABLE seasonal_availability (
    id UUID PRIMARY KEY,
    agro_zone_id UUID NOT NULL REFERENCES agro_zones(id),
    month INTEGER CHECK (month BETWEEN 1 AND 12) NOT NULL,
    food_id UUID NOT NULL REFERENCES foods(id),
    availability TEXT CHECK (availability IN ('abundant', 'available', 'scarce')) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (agro_zone_id, month, food_id)
);

-- NUTRIENT TARGETS (WHO/IYCF references)
CREATE TABLE nutrient_targets (
    id UUID PRIMARY KEY,
    profile TEXT CHECK (profile IN ('pregnant', 'child_6_23m', 'child_24_59m')) NOT NULL,
    nutrient TEXT NOT NULL,      -- iron_mg | folate_ug | energy_kcal | protein_g | vit_a_ug_rae | zinc_mg
    daily_target NUMERIC NOT NULL,
    source TEXT NOT NULL,        -- e.g. "WHO 2012 IYCF guidelines"
    UNIQUE (profile, nutrient)
);

-- CLINICAL THRESHOLDS (sourced from WHO/GHS — never hard-coded in app logic)
CREATE TABLE clinical_thresholds (
    id UUID PRIMARY KEY,
    metric TEXT NOT NULL,        -- muac_mm | hb_g_dl | weight_for_age_zscore
    condition TEXT NOT NULL,     -- client type context (child | pregnant)
    severity TEXT CHECK (severity IN ('ok', 'watch', 'moderate', 'refer')) NOT NULL,
    threshold_value NUMERIC,
    threshold_direction TEXT CHECK (threshold_direction IN ('lt', 'lte', 'gte', 'gt')),
    source TEXT NOT NULL
);

-- VOICE PACKS (per language)
CREATE TABLE voice_packs (
    id UUID PRIMARY KEY,
    language TEXT NOT NULL,      -- "dagbani" | "mampruli" | "hausa" etc.
    version TEXT NOT NULL,
    phrases JSONB NOT NULL,      -- { phrase_key: audio_asset_ref }
    template_map JSONB NOT NULL, -- maps plan fields to phrase keys
    bundle_url TEXT,             -- object storage URL for the ZIP bundle
    active BOOLEAN DEFAULT TRUE
);

-- REFERENCE BUNDLES (versioned, published by admin)
CREATE TABLE reference_bundles (
    id UUID PRIMARY KEY,
    version_tag TEXT UNIQUE NOT NULL,   -- e.g. "v1.4-2026-08"
    description TEXT,
    tables_included JSONB NOT NULL,     -- which tables are in this bundle
    published_by UUID REFERENCES users(id),
    published_at TIMESTAMPTZ DEFAULT NOW(),
    checksum TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE
);
```

### 4.3 On-Device Only (SQLite)

```sql
-- OUTBOX (pending mutations, cleared on successful push)
CREATE TABLE outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idempotency_key TEXT UNIQUE NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT CHECK (operation IN ('insert', 'update', 'delete')) NOT NULL,
    payload TEXT NOT NULL,   -- JSON blob
    created_at INTEGER NOT NULL   -- Unix timestamp
);

-- SYNC STATE (pull cursor per table)
CREATE TABLE sync_state (
    table_name TEXT PRIMARY KEY,
    last_cursor TEXT NOT NULL,   -- ISO timestamp or opaque server cursor
    updated_at INTEGER NOT NULL
);

-- TELEMETRY EVENTS (anonymised, flushed on sync)
CREATE TABLE telemetry_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,   -- PLAN_GENERATED | VOICE_NOTE_PLAYED | REFERRAL_ISSUED | VISIT_DURATION_SEC
    payload TEXT,               -- JSON, no PII
    created_at INTEGER NOT NULL,
    synced_at INTEGER
);
```

---

## 5. Recommendation Engine Algorithm

This is the core IP of the product. It runs entirely on-device, is deterministic, and must produce reproducible results from the same inputs.

### 5.1 Function Signature

```typescript
interface PlanInput {
  clientType: 'pregnant' | 'child';
  ageMonths?: number;           // for children; determines nutrient profile
  gestationWeeks?: number;      // for pregnant women
  flags: Flag[];                // computed flags from the current visit
  agroZoneId: string;
  currentMonth: number;         // 1–12
  affordabilityCeiling: 'staple_cheap' | 'market' | 'premium';  // default: staple_cheap
}

type EngineResult = PlanResult | ReferralRequired;

interface ReferralRequired {
  kind: 'referral';
  triggeringFlags: Flag[];
  message: string;   // plain-language explanation for the worker
}

interface PlanResult {
  kind: 'plan';
  targetNutrients: string[];
  selectedFoods: SelectedFood[];
  adequacy: Record<string, number>;   // nutrient → fraction of daily target (0–1)
  rationale: RationaleEntry[];
  voiceScriptTemplate: string;        // templated before AI enrichment
  referenceBundleVersion: string;
}
```

### 5.2 Step-by-Step Algorithm

**Step 0: Referral guardrail (hard stop)**

Before any computation, check `clinical_thresholds` for severe flags:
- MUAC < 115 mm → `ReferralRequired`
- Hb < 7.0 g/dL → `ReferralRequired`
- Any `DANGER_SIGNS` flag present → `ReferralRequired`

If any severe condition is met, return `ReferralRequired` immediately. Do not proceed.

**Step 1: Determine nutrient profile**

Map client type + age to a nutrient profile and look up daily targets from `nutrient_targets`:

```
pregnant                → profile: 'pregnant'         → { iron: 27mg, folate: 600µg, energy: 2340kcal }
child, 6–23 months     → profile: 'child_6_23m'      → { iron: 11mg, vit_a: 400µg, zinc: 3mg, protein: 13g }
child, 24–59 months    → profile: 'child_24_59m'     → { iron: 7mg, protein: 19g, energy: 1350kcal }
```

**Step 2: Identify active nutrient gaps**

From the flags:
- `FALLING_HB` or anaemia watch → iron, folate (for pregnant); iron (for children)
- `FLAT_WEIGHT` → energy, protein
- `LOW_DIVERSITY` → all food groups; prioritise missing groups from diet recall
- No flag → default to all nutrients for the profile (preventive plan)

**Step 3: Build candidate food set**

Filter `foods` (from local reference bundle) to foods where ALL of:
- `affordability_tier` ≤ `affordabilityCeiling`
- AND at least one of:
  - `seasonal_availability` for (`agroZoneId`, `currentMonth`) is `abundant` or `available`
  - OR `storable = TRUE`
  - OR `garden_wild = TRUE`
- AND `active = TRUE`

**Step 4: Score and select basket**

Goal: select 5–6 foods that maximise nutrient gap coverage with minimum cost and variety.

Greedy selection:
1. For each active nutrient gap, score all candidate foods by: `nutrient_value / affordability_cost_band_rank`.
2. Pick the highest-scoring food for the primary gap not yet covered.
3. Add to basket. Recompute which gaps remain.
4. Repeat until 5–6 items selected or all gaps covered.
5. Prefer diversity: if two foods provide similar gap coverage, prefer different food groups.
6. Prefer `abundant` over `available` over `storable` over `garden_wild` (freshness heuristic).

**Step 5: Compute adequacy**

For each target nutrient:
```
adequacy[nutrient] = sum(food.nutrients[nutrient] × typical_serving) / daily_target
```

Report as a fraction (0–1). The UI renders this as a percentage with a plain-language label.

**Step 6: Build rationale**

For each selected food, record which constraints drove its selection:
```json
{
  "food_id": "uuid",
  "reasons": ["in_season_abundant", "closes_iron_gap", "storable", "affordability_staple_cheap"]
}
```

This is what the UI shows as the plain-language "why" for each food choice.

**Step 7: Assemble script template**

Produce a template string from the plan:
```
"For [client_name]'s health, eat these foods this week: [food1_local_name], [food2_local_name], [food3_local_name].
These foods are available and affordable now. They help with [primary_gap_plain_language].
Remember to take your iron-folate supplement every day." (for pregnant women)
```

This is the fallback voice script. AI enrichment (§7) replaces it with a warmer, natural-language version when online.

---

## 6. Offline-First and Sync Protocol

### 6.1 On-Device Architecture

- **SQLite (op-sqlite + SQLCipher):** encrypted database file. All clinical data lives here first.
- **Outbox table:** every local write is added to the outbox with an idempotency key (UUID v4). The outbox is the source of truth for what needs to be sent.
- **Sync state table:** stores the last successful pull cursor per table.
- **Reference bundles:** stored as JSON files on the device filesystem, versioned. Never modified by the app — replaced entirely on bundle update.

### 6.2 Push Flow (device → server)

```
1. Collect all outbox rows (ordered by created_at)
2. POST /sync/push { mutations: [...] }
   Each mutation: { idempotency_key, entity_type, entity_id, operation, payload }
3. Server upserts each by entity UUID (idempotent — safe to retry)
4. Server sets authoritative updated_at, writes to audit_log
5. Server responds: { accepted: [idempotency_key...], errors: [...] }
6. Device removes accepted rows from outbox
7. On error or network failure: keep in outbox, retry on next sync
```

### 6.3 Pull Flow (server → device)

```
1. GET /sync/pull?since=<cursor>&tables=clients,visits,flags,plans,referrals
2. Server returns rows changed (or soft-deleted) since cursor for each table
3. Device applies changes (upsert by UUID; mark local rows as deleted_at if server sends deleted_at)
4. Device advances cursor ONLY if all tables applied without error
5. On partial failure: do not advance cursor; retry full pull
```

### 6.4 Reference Bundle Flow

```
1. GET /reference/manifest → { bundles: [{ name, current_version, checksum }] }
2. Compare to local bundle versions in sync_state
3. For each out-of-date bundle: GET /reference/:bundle/:version (gzipped JSON)
4. Verify checksum; replace local file atomically
5. Re-index SQLite from new bundle (foods, seasonal_availability, nutrient_targets, clinical_thresholds, voice_packs)
```

### 6.5 Conflict Resolution

| Entity | Strategy |
|---|---|
| `visits` | Append-only. No true conflicts. |
| `client` profile fields | Last-write-wins by server `updated_at`. |
| `referral` status | Surface conflict flag for worker resolution. Never silently overwrite. |
| `plans`, `flags` | Derived — can be recomputed. Safe to overwrite. |

### 6.6 Sync Trigger Events

- App comes to foreground (after ≥ 5 min background)
- Network state changes to connected
- Background task (every 15 min when connected)
- Immediately after recording a referral (emergency push — small payload, battery-agnostic)
- Heavy bundle downloads: only when battery > 30% OR charging

---

## 7. AI Integration

### 7.1 Two-Layer Architecture

```
CLINICAL CORE (device, deterministic, always available)
  visit data  ──► flags/prioritisation  ─┐
                                          ├──► PLAN (fixed foods + fixed clinical facts)
  reference bundle ──► food selection  ──┘          │
                                                     │ (when online)
                                                     ▼
                                        AI ENRICHMENT (server-side, optional)
                                          LLM: rephrase facts into
                                          warm local-language script ──► cache to device

free-text recall ─(online)─► LLM: parse ──► food groups ──► diet-diversity input
                 └─(offline)─► manual food-group tap-select (fallback)
```

The LLM never decides what to recommend. It only formats and parses.

### 7.2 Flow 1 — Counselling Script Generation (Primary AI Feature)

**Purpose:** Turn the deterministic plan (fixed list of foods and fixed clinical facts) into a warm, plain, culturally appropriate caregiver script ready for voice.

**Trigger:** Plan generated and device is online (or on background sync).

**Where it runs:** Backend proxies to Claude API. Keys never touch the device.

**Input to LLM:**
```json
{
  "client": { "type": "pregnant", "gestation_weeks": 30 },
  "language": "dagbani",
  "target_nutrients": ["iron", "folate"],
  "foods": [
    { "name": "zogale leaves", "local": "zogale", "why": "in season, iron+folate" },
    { "name": "dried small fish", "local": "amani", "why": "storable, iron+protein" },
    { "name": "cowpea", "local": "tuya", "why": "storable, protein+folate" }
  ],
  "clinical_note": "reinforce daily iron-folate supplement"
}
```

**System prompt (essence):**
```
You are a nutrition counselling translator. Rephrase ONLY the facts provided into a short,
warm, plain caregiver message in the target language. Do not add any food, quantity, dosage,
or medical claim not present in the input. Return JSON: { "script": "..." }. No prose, no code
fences, no explanation.
```

**Output validation (non-negotiable):**
- Parse JSON; reject if malformed.
- Check every food name in the script is present in the input foods list.
- Check no numeric value appears in the script that is not in the input.
- On validation failure: discard, fall back to template script.
- Log: input hash, model, version, output hash, validation_passed.

**Caching:** Cache by plan signature = hash(client_profile + food_ids + language + bundle_version). Identical plans generate once.

**Offline fallback:** Use templated script from Step 7 of the engine. AI script replaces it on next sync.

### 7.3 Flow 2 — Dietary Recall Parsing (Could-Have)

**Purpose:** Allow the worker to describe what was eaten in free text or speech; convert to structured food groups.

**Input:** `"She ate tuo zaafi with groundnut soup and a boiled egg for breakfast, and rice in the evening."`

**Output:** `{ "food_groups": ["grains", "legumes_nuts", "eggs"] }`

**Worker confirmation:** Output is shown to the worker before it counts toward the DDS. The worker can correct or override.

**Offline fallback:** Manual food-group tap-select remains the default capture UI. Parsing is layered on top.

### 7.4 Flows 3–5 (Roadmap)

- **Flow 3 — ASR/TTS:** Local-language speech recognition and synthesis. Deferred — no reliable service for Dagbani/Mampruli yet.
- **Flow 4 — Learned risk ranking:** Gradient-boosted trees to rank the follow-up list once sufficient visit data exists. Ranking aid only; rule-based flags remain the source of truth.
- **Flow 5 — Supervisor summarisation:** Server-side LLM summary of a facility's caseload for a district supervisor. Read-only aggregate.

### 7.5 Responsible AI Controls

| Control | Implementation |
|---|---|
| No PII to LLM | Send plan facts only; no client name, ID, or health record |
| Output validation | Check foods + claims against deterministic plan before use |
| Fallback | Template always available; LLM is enhancement only |
| Audit log | Every LLM call: input hash, model, version, output hash, validation result |
| Human review | Worker reviews every plan and script before caregiver sees it |
| Explainability | Every plan reproducible from inputs + bundle version; rationale exposed in UI |

### 7.6 Model and Cost

- **Model:** Claude Haiku (fast, low-cost, sufficient for short structured tasks).
- **Upgrade to Sonnet:** only if translation quality is inadequate for the target language.
- **Cost bound:** short prompts, aggressive caching, server-side batching, generation only when online.
- **API keys:** server-side only (environment variables on the Express host). Never ship keys to the device.

---

## 8. Voice Delivery System

### 8.1 Approach

**Pre-recorded human voice** (not TTS). A native-speaking health worker records a fixed phrase set. This is safer than TTS for clinical messages in low-resource languages where TTS quality is unreliable.

### 8.2 Phrase Architecture

A voice pack contains:
- **Named audio clips** for: each food's local name, standard counselling phrases (greetings, "eat this food", "every day", "remember your supplement", "go to the health facility immediately"), and connecting words.
- **Template map:** a JSON structure mapping a plan's fields to an ordered sequence of phrase keys.

Example template map:
```json
{
  "pregnant_plan": [
    "greeting",
    "counselling_intro",
    { "repeat": "food_name:{food_id}" },
    "supplement_reminder",
    "closing"
  ]
}
```

The app assembles clips in order → a single `.aac` audio file per plan.

### 8.3 Bundle Delivery

- Voice packs are stored in object storage as versioned ZIP bundles.
- Only download the pack for the device's assigned district and language.
- Audio: AAC-HE or Opus, 32 kbps mono, < 15 MB per full language pack.
- Compressed ZIP, downloaded and extracted at bundle-update time.

### 8.4 Playback and Sharing

```typescript
// Playback
Audio.Sound.createAsync({ uri: plan.assembledAudioUri });

// Share
Share.share({ url: plan.assembledAudioUri, message: 'NurtureLink nutrition plan' });
// or Bluetooth transfer for feature phones
```

### 8.5 Language Roadmap

Dagbani first (pilot district). Engineering scaffolding is language-agnostic — adding a language is a recording task, not an engineering task.

Planned: Mampruli, Gonja, Gurune, Dagaare, Kusaal, Hausa.

---

## 9. Admin Web Back-Office

A lightweight React/Vite web application for district nutrition officers and system admins. Eliminates manual seed scripts for reference data management.

### 9.1 Roles

| Role | Permissions |
|---|---|
| `system_admin` | User provisioning, facility mappings, system parameters, publish bundles |
| `district_admin` | Food composition CRUD, seasonal calendar, audio uploads, DHIMS2 export |

### 9.2 Modules

**1. Food Composition Manager**
- Bulk CSV/Excel upload: columns = name, local_names (dagbani, mampruli, ...), food_group, iron_mg, folate_ug, protein_g, energy_kcal, vit_a_ug_rae, zinc_mg, affordability_tier, storable, garden_wild.
- Visual table editor for in-place edits.
- Validation: required nutrients, valid tier values, valid food groups.

**2. Seasonal Matrix Scheduler**
- Interactive grid: rows = foods, columns = months 1–12, cells = abundant / available / scarce / (blank = not available).
- Filter by agro-zone.
- Changes are staged (not live) until an admin publishes a new bundle.

**3. Voice Pack Audio Studio**
- Upload `.mp3`/`.aac` audio files tagged with a phrase key.
- Preview playback in browser.
- Auto-packages into a compressed ZIP bundle on publish.

**4. Clinical Rules Governance Console**
- View current thresholds with their WHO/GHS source citations.
- Propose an update: fill new value + justification.
- Requires a second admin to sign off before the updated bundle is published.
- Full change log.

**5. Reference Bundle Publisher**
- Shows current vs. staged changes across all reference tables.
- One-click publish: generates a version tag (e.g., `v1.4-2026-08`), computes checksum, writes to `reference_bundles`, makes available at `/reference/manifest`.

**6. DHIMS2 Export & Reporting**
- Select facility + reporting period → generate CHPS tally summary.
- Download as CSV or dispatch as DHIMS2-compatible payload.
- Aggregate indicators: clients seen, severe cases referred, plans generated, MAD rate (where visit data allows).

---

## 10. DHIMS2 Interoperability

NurtureLink complements DHIMS2; it does not replace or duplicate it.

### 10.1 MVP Export

- Aggregate indicators per facility per reporting period.
- Format: CSV matching national CHPS tally sheet columns.
- Available via Admin back-office: select facility + month → download.

### 10.2 API Endpoint

```
POST /export/dhims2
Body: { facility_id, period_start, period_end }
Response: { format: "csv", data: "...", metadata: { ... } }
```

### 10.3 Roadmap

Post-MVP: direct DHIS2 Web API integration (the platform behind DHIMS2). Push aggregate indicators directly to the national system via authenticated API calls.

---

## 11. Security and Privacy

### 11.1 Legal Basis

Ghana Data Protection Act, 2012 (Act 843): lawful basis, data minimisation, purpose limitation, data subject rights.

### 11.2 On-Device

- SQLite encrypted with SQLCipher (AES-256). Key derived from user PIN/password.
- Multi-worker device sharing: each user logs in with their own PIN. Row-level security: un-synced draft visits locked to the creating user's session.
- App lock on background (configurable timeout).
- Data scoped to the worker's facility only.

### 11.3 In Transit

- TLS 1.2+ for all API calls. Certificate pinning for the mobile app.
- JWT access tokens (short-lived: 15 min) + refresh tokens (7 days, httpOnly cookie on admin web).
- No API keys on the device.

### 11.4 At Rest (Server)

- Encrypted volumes for Postgres and object storage.
- Least-privilege DB roles: the API service account has no DDL permissions.
- Audit log captures every write: user, entity, action, timestamp, change summary.

### 11.5 Data Minimisation

- Collect only what CHPS already records.
- Affordability stored as tier (not financial detail).
- Only plan facts (not client identity) sent to LLM.

### 11.6 Consent and Subject Rights

- Capture client consent at registration (`consent_at` field).
- Withdrawal: soft-delete (`deleted_at`) + schedule data purge on next sync.
- Health data stewardship: design assumes eventual GHS stewardship.

### 11.7 Authentication Flow

```
POST /auth/login  { phone, password }
  → verify password_hash (bcrypt)
  → return { access_token (JWT 15min), refresh_token (opaque, stored server-side) }

POST /auth/refresh  { refresh_token }
  → validate, rotate refresh token
  → return new access_token

All protected routes → authenticate middleware → verify JWT signature + expiry → attach user to req
RBAC middleware → check role against route permission map
```

---

## 12. Hardware and Device Constraints

### 12.1 Target Device

- Android 8.0 (API level 26) minimum.
- ~2 GB RAM, low-end processor.
- Limited storage (shared with other apps).

### 12.2 Storage Budget

| Asset | Budget |
|---|---|
| APK size | < 30 MB |
| Voice pack (full language, all phrases) | < 15 MB per language |
| SQLite database (per device) | < 50 MB for typical caseload |
| Total on-device cap | 250 MB |

Auto-clear synced audio cache when device storage drops below 10% free.

### 12.3 Battery Awareness

| Sync Type | Battery Condition |
|---|---|
| Emergency push (referral) | Always — lightweight JSON payload |
| Standard push/pull | Any — small payload |
| Reference bundle download | Battery > 30% OR charging |
| Voice pack download | Battery > 30% OR charging + WiFi preferred |

### 12.4 Audio Encoding Requirements

- Format: AAC-HE or Opus
- Bitrate: 32 kbps mono
- Sample rate: 22,050 Hz
- Container: M4A (AAC-HE) or OGG (Opus)

### 12.5 Performance Targets

| Operation | Target |
|---|---|
| App cold start | < 3 s |
| Priority list load | < 500 ms (from local SQLite) |
| Client visit screen load | < 300 ms |
| Recommendation engine | < 1 s on-device |
| Voice note assembly | < 2 s |

---

## 13. UNICEF Challenge Area Mapping

| # | Challenge Area | NurtureLink | Depth |
|---|---|---|---|
| 1 | Predicting risk before crisis | Priority list ranked by each client's own visit trend (falling Hb, flat weight-for-age, low DDS, danger signs) | Touched (solid) |
| 2 | Last-mile follow-up | Severe cases route to referral guardrail; post-referral tracking deferred to roadmap | Deferred (roadmap) |
| 3 | Local-food nutrition intelligence | Core product: seasonal, affordable, locally available feeding plan matched to nutrient gap with longitudinal record | Core (deep) |
| 4 | Voice-first caregiver support | Plan delivered as local-language voice note the caregiver keeps on any phone | Core (channel) |
| 5 | Smarter CHPS workflows | Offline visit capture, auto-computed trends and flags, DHIMS2-compatible tally export | Touched (solid) |
| 6 | Hidden barriers to care | Accounts for seasonal and affordability access barriers; socio-cultural barriers deferred | Lightly touched |

### Pitch framing

Lead with **Challenge 3** (local-food nutrition intelligence) as the one deep problem. Name **Challenge 4** (voice-first) as the delivery channel. Note that **Challenges 1 and 5** come along naturally from the same visit data. State plainly that last-mile tracking (2) and wider care-seeking barriers (6) are deliberately on the roadmap — this signals engineering discipline and matches what the evaluators reward. Do not claim all six.
