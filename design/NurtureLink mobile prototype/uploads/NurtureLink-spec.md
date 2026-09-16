Here is the updated, production-ready **Master Specification (v2.0)** for NurtureLink.

It addresses the product owner critique by adding **Field Operational Workflows**, **Hardware Storage & Power Budgets**, **Multi-User Handset Semantics**, **Offline Telemetry**, and a dedicated **Admin Web Back-Office (RDM & DataOps)** to manage reference data, seasonal calendars, and clinical governance.

---

# NurtureLink — Reconciled Master Specification (v2.0)

**Product:** NurtureLink — Offline-first nutrition companion and decision-support platform for CHPS frontline health workers in Northern Ghana

**Author:** Yakubu Lute (Product Owner / Technical Lead)

**Status:** Production-Ready Master Specification (v2.0)

---

## 1. Product Summary & Vision

NurtureLink enables Community Health Officers (CHOs) and nutrition officers in rural Northern Ghana to accomplish three critical tasks during and after client visits:

1. **Track Longitudinal Trends:** Converts existing clinical metrics (weight, haemoglobin/Hb, MUAC, and short dietary recall) into an actionable nutrition trend and prioritised follow-up list without adding administrative burden.

2. **Generate Targeted Feeding Plans:** Produces an explainable, seasonally appropriate, and affordable food plan tailored to address the client's specific nutrient gap. The plan is delivered as a local-language voice note for the caregiver. Severe clinical cases bypass counseling and route directly to secondary care referrals.

3. **Data & Clinical Governance:** Provides an Admin Web Back-Office for district nutrition officers to manage seasonal food calendars, food composition datasets, audio assets, and DHIMS2 export mappings.

---

## 2. UNICEF Challenge Area Alignment

| # | Challenge Area | NurtureLink Scope | Depth Level |
| --- | --- | --- | --- |
| **1** | **Predicting Risk Before Crisis** | Ranks follow-up priorities based on individual visit trends (falling Hb, flat weight-for-age, low diet diversity).

 | **Touched (Solid)**<br> |
| **2** | **Last-Mile Follow-Up** | Severe cases route to referral guardrails; post-referral tracking is deferred.

 | **Deferred (Roadmap)**<br> |
| **3** | **Local-Food Nutrition Intelligence** | Core engine: builds seasonal, affordable, locally available feeding plans matching nutrient gaps.

 | **Core (Deep)**<br> |
| **4** | **Voice-First Caregiver Support** | Delivers plans via local-language voice notes playable or shareable on feature/smartphones.

 | **Core (Channel)**<br> |
| **5** | **Smarter CHPS Workflows** | Offline visit capture, auto-computed flags, and time-saving DHIMS2 tally exports.

 | **Touched (Solid)**<br> |
| **6** | **Hidden Barriers to Care** | Accounts for seasonal and affordability constraints; defers complex socio-cultural barriers.

 | **Lightly Touched**<br> |

---

## 3. System Architecture & Two-Layer Posture

```
 [ Admin Web Back-Office ] (React/Vite or Express Admin)
            │
            ▼  (Bulk CSV/JSON, Audio Uploads, Governance Sign-off)
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND API (Express.js + Prisma)                     │
│  - JWT Auth / RBAC              - Reference Data Versioning Engine             │
│  - Sync Gateway (Push/Pull)     - DHIMS2 Aggregator & Tally Exporter            │
└───────────────────────┬─────────────────────────────────┬───────────────────────┘
                        │                                 │
           (Sync / Versioned Bundles)                (API Proxy)
                        │                                 │
                        ▼                                 ▼
┌──────────────────────────────────────────────┐  ┌──────────────────────────────┐
│  CLINICAL CORE (Mobile Device / Offline)     │  │ AI ENRICHMENT (Optional Server)│
│  - SQLCipher Encrypted SQLite                │  │ - LLM Script Rephraser       │
│  - Deterministic Food Basket Engine          │  │ - Free-text Recall Parser    │
│  - Referral Guardrail Safety Gate            │  │ - Fallback: Templated Engine │
└──────────────────────────────────────────────┘  └──────────────────────────────┘

```

### 3.1 Two-Layer Architectural Principle

* **Clinical Core (On-Device, Always Available):** Handles risk flags, food basket selection, nutrient calculations, and referral thresholds. It uses explicit WHO/IYCF/GHS rules. **No AI makes clinical decisions**.

* **AI Enrichment Layer (Server-Side, Optional):** Formats facts into natural local-language scripts and parses free-text recall into standard food groups. If offline or unavailable, the system defaults to deterministic templates.

---

## 4. Admin Web Back-Office & DataOps Specification

To remove manual seed scripts and allow non-technical domain experts to maintain system data, a lightweight web-based administrative console is included.

### 4.1 Admin Users & Role-Based Access Control (RBAC)

* **System Admin:** Manages user provisioning, facility mappings, and system parameters.

* **District Nutrition Officer / Health Admin:** Curates food composition databases, updates monthly seasonal availability per agro-zone, uploads audio voice packs, and signs off on clinical rule updates.

### 4.2 Web Back-Office Key Modules

1. **Reference Data & Food Composition Manager:**

* Bulk upload (CSV/Excel) of local food composition tables (nutrients per 100g, food groups, local names in Dagbani/Mampruli/etc.).

* Visual table editor for setting affordability tiers (`staple_cheap`, `market`, `premium`).

1. **Seasonal Matrix & Agro-Zone Scheduler:**

* Interactive grid view mapping foods to months and agro-zones (`abundant`, `available`, `scarce`).

* One-click publishing: creates a signed, immutable reference bundle version (e.g., `bundle_v1.4_2026_08`) that field devices pull during sync.

1. **Voice Pack & Audio Asset Studio:**

* Upload and preview `.mp3`/`.aac` audio files for food names and standard counseling phrases.

* Auto-packages audio files into compressed ZIP bundles for device downloading.

1. **Clinical Rules & Governance Console:**

* View and update WHO/GHS risk thresholds.

* Requires explicit admin sign-off and change log comment before publishing a new bundle version.

1. **DHIMS2 Export & Facility Reporting:**

* Generates monthly CHPS tally summaries matching national reporting formats.

* Supports manual CSV download or direct DHIMS2 Web API payload dispatch.

---

## 5. Field Operational Workflows & Adoption Engineering

### 5.1 CHPS Workflow Integration (Eliminating "Double Data Entry")

To ensure health workers adopt NurtureLink alongside mandatory paper registers:

* **Pre-Visit Prioritisation:** CHO opens the app at the start of the day to see a pre-sorted list of high-risk clients (faltering growth, falling Hb), eliminating manual file hunting.

* **Integrated Visit Capture:** Entering data takes < 60 seconds (numeric fields for weight/Hb/MUAC, tap-selectors for diet recall).

* **Automated Monthly Tallies:** In return for digital entry, NurtureLink generates the CHO’s monthly aggregated tally sheet, saving them hours of manual counting for DHIMS2 at the end of the month.

### 5.2 Voice Asset Transfer Protocols

To support low-literacy caregivers regardless of their handset type:

1. **Primary (In-Person Playback):** The CHO plays the local-language audio plan directly from the app’s speaker during counseling.

2. **Feature Phone Transfer (No Internet):** App supports direct offline Bluetooth push or audio playback recording.
3. **Smartphone Transfer (Online/Peer-to-Peer):** Sharing via WhatsApp or local peer-to-peer file transfer (e.g., Xender).

---

## 6. Technical Edge Cases, Hardware & Offline Telemetry

### 6.1 Multi-Worker Device-Sharing Semantics

* **Encrypted Multi-Profile DB:** When multiple CHOs share a single compound device, each user logs in with a PIN/Password.

* **Row-Level Security:** Un-synced draft visits created by User A are locked to User A's session, but finalized client history remains viewable to any authorized worker on that facility's handset.

### 6.2 Storage & Media Budgeting for Low-End Handsets

* **Audio Compression:** Voice assets must be encoded in AAC-HE or Opus format at 32 kbps mono, keeping full language packs under 15 MB.
* **On-Demand Bundles:** Devices only download the voice pack and seasonal bundle corresponding to their assigned district and language.

* **Storage Quota Guardrail:** Local storage utilization is capped at 250 MB total. Old synced audio caches are automatically cleared when device storage drops below 10%.

### 6.3 Battery & Power Awareness

* **Adaptive Sync Scheduling:** Heavy background syncs (voice pack updates, full database pulls) execute only when the battery level is $> 30\%$ or connected to power. Emergency push syncs (referrals) utilize lightweight JSON payloads regardless of battery level.

### 6.4 Offline Telemetry Strategy

To track usage without internet connectivity:

* **Local Event Queue:** Key events (`PLAN_GENERATED`, `VOICE_NOTE_PLAYED`, `REFERRAL_ISSUED`, `VISIT_DURATION_SEC`) are stored in an encrypted `telemetry_events` table.

* **Anonymized Flush:** Upon network connection, telemetry batches are sent alongside standard sync payloads, stripped of personal identifying information (PII).

---

## 7. Complete Database Schema (PostgreSQL & On-Device SQLite)

### 7.1 Domain & Core Tables

```sql
-- Users & Auth (Back-Office & Mobile)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('system_admin', 'district_admin', 'CHO', 'nutrition_officer', 'supervisor')) NOT NULL,
    facility_id UUID,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client Records
CREATE TABLE clients (
    id UUID PRIMARY KEY,
    household_id UUID NOT NULL,
    type TEXT CHECK (type IN ('pregnant', 'child')) NOT NULL,
    name TEXT NOT NULL,
    dob DATE,
    edd_gestation TEXT,
    sex TEXT,
    consent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Visit Entries
CREATE TABLE visits (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id),
    user_id UUID NOT NULL REFERENCES users(id),
    visited_at TIMESTAMP WITH TIME ZONE NOT NULL,
    weight_kg NUMERIC(4,2),
    hb_g_dl NUMERIC(3,1),
    muac_mm NUMERIC(4,1),
    diet_recall JSONB NOT NULL, -- e.g. ["grains", "legumes", "dairy"]
    danger_signs JSONB,
    synced_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Generated Plans
CREATE TABLE plans (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id),
    visit_id UUID NOT NULL REFERENCES visits(id),
    target_nutrients JSONB NOT NULL,
    foods JSONB NOT NULL,
    adequacy JSONB NOT NULL,
    rationale JSONB NOT NULL,
    voice_script TEXT,
    voice_pack_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

```

### 7.2 Reference Data & Operations Tables (Managed via Web Back-Office)

```sql
-- Master Food List
CREATE TABLE foods (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    local_names JSONB NOT NULL, -- {"dagbani": "zogale", "mampruli": "..."}
    food_group TEXT NOT NULL,
    nutrients JSONB NOT NULL, -- {"iron_mg": 4.2, "protein_g": 6.1}
    affordability_tier TEXT CHECK (affordability_tier IN ('staple_cheap', 'market', 'premium')) NOT NULL,
    storable BOOLEAN DEFAULT FALSE,
    garden_wild BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE
);

-- Seasonal Matrix (Managed in Web Console)
CREATE TABLE seasonal_availability (
    id UUID PRIMARY KEY,
    agro_zone_id UUID NOT NULL,
    month INTEGER CHECK (month BETWEEN 1 AND 12) NOT NULL,
    food_id UUID NOT NULL REFERENCES foods(id),
    availability TEXT CHECK (availability IN ('abundant', 'available', 'scarce')) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Published Bundles Tracker
CREATE TABLE reference_bundles (
    id UUID PRIMARY KEY,
    version_tag TEXT UNIQUE NOT NULL, -- e.g., 'v1.4-2026-08'
    description TEXT,
    published_by UUID REFERENCES users(id),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    checksum TEXT NOT NULL
);

-- Offline Telemetry Queue
CREATE TABLE telemetry_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE
);

```

---

## 8. Implementation Roadmap

* **Phase 1: Foundation & Web Back-Office Core**
* Scaffold Express/TS API, Prisma models, and React Admin Back-Office.
* Build CSV/Excel importer for seasonal food calendars and food composition tables.

* **Phase 2: Mobile Client & Offline Core (Tamale Bootcamp)**
* Implement encrypted SQLite schema, offline visit registration, and local risk flags.

* Integrate deterministic recommendation algorithm and templated voice note generation.

* Implement push/pull sync engine with adaptive battery/network handling.

* **Phase 3: AI Integration & Pilot Rollout**
* Wire server-side LLM proxy for script rephrasing with output validation guardrails.

* Deploy DHIMS2 tally export feature for district nutrition officers.
