# CLAUDE.md — NurtureLink

NurtureLink is an offline-first nutrition decision-support app for CHPS Community Health Officers in rural Northern Ghana. It tracks longitudinal client nutrition trends and generates seasonally appropriate, affordable, local-language feeding plans.

Built for the UNICEF AI for Nurturing Care Hackathon (KOICA / MEST StartUp Lab). Bootcamp: 26–28 August 2026, Tamale. Application deadline: 11 August 2026.

---

## Tech Stack (locked decisions)

| Layer | Choice | Rationale |
| --- | --- | --- |
| Mobile | React Native + Expo (EAS) | Team's existing RN/Expo expertise; TypeScript shared with backend |
| Backend | Express.js + TypeScript | Matches AgroLink's Repository→Service→Route pattern; one language across stack |
| ORM | Prisma | Typed models, clean Postgres migrations |
| Server DB | PostgreSQL | Given |
| On-device DB | op-sqlite (SQLCipher encryption) | Control + simplicity; encrypted at rest |
| Validation | Zod (shared client/server) | End-to-end type safety |
| Object storage | S3-compatible | Voice pack audio assets |
| Admin UI | React + Vite (or Express Admin) | Reference data curation for district nutrition officers |
| LLM | Claude API (Haiku tier) | Script rephrasing and free-text recall parsing only |

---

## Repository Structure

```text
mest-hackathon/
├── apps/
│   ├── mobile/              # React Native / Expo app
│   │   ├── src/
│   │   │   ├── screens/     # UI screens (Register, Visit, Plan, Referral)
│   │   │   ├── components/  # Shared UI components
│   │   │   ├── db/          # op-sqlite schema, migrations, queries
│   │   │   ├── engine/      # Deterministic recommendation engine (core IP)
│   │   │   ├── sync/        # Outbox, pull cursor, sync orchestrator
│   │   │   ├── audio/       # Voice pack assembly, playback
│   │   │   └── store/       # Local state (Zustand or Context)
│   │   ├── assets/
│   │   └── app.json
│   └── admin/               # Web back-office (React / Vite)
│       └── src/
│           ├── pages/        # Food manager, seasonal matrix, voice studio, clinical rules
│           └── api/          # Admin API client
├── packages/
│   ├── api/                 # Express.js backend
│   │   └── src/
│   │       ├── routes/      # Thin controllers: validate (Zod) → call service
│   │       ├── services/    # Business logic: sync, export, reference versioning
│   │       ├── repositories/# Prisma data access — no business logic here
│   │       ├── middleware/   # Auth (JWT), RBAC, error handling
│   │       └── lib/         # LLM proxy, DHIMS2 exporter, bundle builder
│   └── shared/              # Zod schemas, TypeScript types shared across all packages
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
│   └── specifications/      # Source specs — read-only reference
├── CLAUDE.md
└── SKILLS.md
```

---

## Key Commands

```bash
# Install (from root — monorepo managed with pnpm workspaces)
pnpm install

# Backend
pnpm --filter api dev           # Start Express dev server
pnpm --filter api db:migrate    # Run Prisma migrations
pnpm --filter api db:seed       # Seed pilot district food/seasonal data
pnpm --filter api test          # Jest unit + integration tests

# Mobile
pnpm --filter mobile start      # Expo dev server
pnpm --filter mobile android    # Run on Android device/emulator
pnpm --filter mobile build      # EAS build (APK)

# Admin
pnpm --filter admin dev         # Vite dev server

# Shared
pnpm --filter shared build      # Compile Zod schemas and types

# Root
pnpm lint                       # ESLint across all packages
pnpm typecheck                  # tsc --noEmit across all packages
pnpm test                       # All tests
```

---

## Code Patterns and Conventions

### Backend: Repository → Service → Route

```typescript
// Route: thin. Validate input, delegate to service, return response.
router.post('/sync/push', authenticate, async (req, res) => {
  const body = SyncPushSchema.parse(req.body);   // Zod — throws on invalid
  const result = await syncService.push(body, req.user);
  res.json(result);
});

// Service: business logic. No Prisma calls directly.
class SyncService {
  constructor(private repo: SyncRepository) {}
  async push(batch: SyncPushPayload, actor: AuthUser) { ... }
}

// Repository: Prisma only. No logic, no decisions.
class SyncRepository {
  async upsertVisit(data: VisitUpsert) {
    return prisma.visit.upsert({ where: { id: data.id }, ... });
  }
}
```

### Mobile: engine is pure and deterministic

The recommendation engine (`apps/mobile/src/engine/`) must be a pure function:

```typescript
generatePlan(input: PlanInput, referenceBundle: ReferenceBundle): PlanResult | ReferralRequired
```

No side effects, no network calls, no randomness. Given the same inputs and bundle version, it always returns the same plan. This is a hard requirement for auditability.

### Shared Zod schemas

Define all entity schemas in `packages/shared`. Import them in both `apps/mobile` and `packages/api`. Never duplicate type definitions.

### Native UI Components — always prefer over custom text inputs

Use the platform's own widgets wherever they exist. Never use a `TextInput` to collect data that has a dedicated native control.

| Use case | Component | Notes |
|---|---|---|
| Date / time entry | `@react-native-community/datetimepicker` | Renders native calendar on Android/iOS; `<input type="date">` on web |
| Toggle / on-off | `Switch` (React Native built-in) | Use for boolean settings, not custom `View` toggles |
| Scroll lists | `FlatList` / `SectionList` | Never render a long list inside a `ScrollView` |
| Alerts / confirmations | `Alert` (React Native built-in) | Never build a custom modal for simple yes/no prompts |
| Loading indicator | `ActivityIndicator` (React Native built-in) | |

**Date picker implementation pattern:**

```typescript
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, Pressable } from 'react-native';
import { CalendarDays } from 'lucide-react-native';

// Android: tap button → native dialog (auto-dismisses)
// iOS:     inline spinner always visible below the field
// Web:     renders as <input type="date"> automatically

const [showPicker, setShowPicker] = useState(false);
const dateValue = isoString ? new Date(isoString) : null;

// Pressable trigger (Android / web only — iOS shows inline)
{Platform.OS !== 'ios' && (
  <Pressable style={styles.dateBtn} onPress={() => setShowPicker(true)}>
    <CalendarDays size={18} color="#9CA3AF" />
    <Text>{dateValue ? formatDate(dateValue) : 'Select date'}</Text>
  </Pressable>
)}

// Picker (always visible on iOS; toggle on Android/web)
{(showPicker || Platform.OS === 'ios') && (
  <DateTimePicker
    value={dateValue ?? new Date()}
    mode="date"
    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
    maximumDate={new Date()}
    onChange={(_, date) => {
      setShowPicker(false);
      if (date) onChange(date.toISOString().slice(0, 10)); // store as YYYY-MM-DD
    }}
  />
)}
```

**Rules:**
- Never use `TextInput` with `keyboardType="numeric"` for dates — use `DateTimePicker`
- Always store dates as ISO strings (`YYYY-MM-DD`) internally, format for display only
- Pass `maximumDate={new Date()}` for past dates (DOB), omit for future dates (EDD)
- For EDD / future dates, do **not** set `maximumDate`

---

### Icons — non-negotiable

All icons in the mobile app **must** use `lucide-react-native`. No exceptions.

```typescript
// ✅ Correct
import { ChevronLeft, Bell, AlertTriangle } from 'lucide-react-native';
<ChevronLeft size={24} color="#08283B" />

// ❌ Forbidden — never do any of these
<Text>‹</Text>          // Unicode character as icon
<Text>🔔</Text>         // Emoji as icon
<Text>⚠</Text>          // Symbol as icon
// Custom View-drawn icon shapes (border trick triangles, etc.)
// @expo/vector-icons or any other icon library
```

**Rules:**
- Import named icon components directly from `lucide-react-native`
- Always pass `size` (number, default 24) and `color` (hex string)
- No emoji characters anywhere in UI components — not even for "convenience"
- No ad-hoc icon implementations (border-trick shapes, Unicode symbols, image files used as icons)
- No other icon library (`@expo/vector-icons`, `react-native-vector-icons`, `phosphor-react-native`, etc.)

---

## Architecture Invariants — Never Break These

1. **The LLM never makes clinical decisions.** The clinical core (flags, food selection, nutrient adequacy, referral thresholds) is deterministic rule-based logic running on-device. The LLM only rephrases a fixed plan into natural language and parses free-text recall. If the LLM is down, care continues.

2. **The mobile app is fully functional with no network.** Every core flow — register client, record visit, compute flags, generate plan, issue referral — must work offline indefinitely. Network is an enhancement for sync and AI enrichment only.

3. **Local writes always succeed.** Never block the UI on a network call. Write to SQLite first; queue for sync via the outbox.

4. **Severe cases never receive a home-management plan.** If MUAC < 115 mm (child), Hb < 7 g/dL, or any obstetric danger sign is present, the engine must return `ReferralRequired` and block plan generation. This is a safety gate, not optional.

5. **Clinical thresholds live in reference data, not code.** They are versioned, auditable, and updatable without a code release. Never hard-code a clinical threshold as a magic number.

6. **Every plan is reproducible.** Store the `reference_bundle_version` with every plan so any plan can be recomputed from its inputs.

7. **Soft delete only.** Never hard-delete clinical data. Use `deleted_at` for all client-writable entities.

8. **No client PII is sent to the LLM.** Send the plan facts (foods, nutrients, language), never the client's name, identity, or health record.

---

## Data Model Quick Reference

See `SKILLS.md §4` for the full annotated schema.

**Core tables (server + device):** `users`, `facilities`, `households`, `clients`, `visits`, `flags`, `plans`, `referrals`

**Reference tables (read-only on device, managed via Admin):** `foods`, `seasonal_availability`, `agro_zones`, `nutrient_targets`, `voice_packs`, `clinical_thresholds`, `reference_bundles`

**Sync tables (device):** `outbox`, `sync_state`

**Operational tables (server):** `audit_log`, `telemetry_events`

All client-writable rows carry: `id UUID (client-generated)`, `updated_at`, `deleted_at`, `synced_at`.

---

## Sync Protocol

**Push:** POST `/sync/push` — idempotent batch of outbox rows. Server upserts by UUID, sets authoritative `updated_at`, returns accepted IDs. Device clears accepted rows from outbox.

**Pull:** GET `/sync/pull?since=<cursor>&tables=visits,clients,...` — server returns rows changed since cursor including soft-deletes. Device advances cursor only on full success.

**Reference bundles:** GET `/reference/manifest` → compare versions → GET `/reference/:bundle/:version` to download changed bundles.

**Conflict resolution:** last-write-wins by server `updated_at` for most fields. For mutable clinical entities (client profile, referral status), surface a conflict flag for worker resolution — never silently overwrite clinical data.

**Connectivity triggers:** sync on app foreground, on network-state change, and on a periodic background task. Heavy pulls (voice packs) only when battery > 30% or charging. Emergency pushes (referrals) always.

---

## AI Integration

See `SKILLS.md §7` for full prompt design, validation, and flow details.

**Flow 1 — Script rephrasing (primary AI feature):**
Backend receives structured plan JSON → proxies to Claude Haiku → validates output (only references foods in the plan, no new clinical claims) → caches by plan signature → device retrieves on next sync.

**Flow 2 — Dietary-recall parsing (Could-have):**
Free-text description → Claude → structured food groups → worker confirms before it counts.

**Offline fallback for both:** templated string interpolation from plan data. Never block care on an LLM call.

---

## Testing Requirements

- **Recommendation engine:** golden-file tests covering every nutrient-gap profile × season × affordability tier × severe case. Determinism test: same input must always produce same output.
- **Sync:** round-trip tests — offline-created records push and pull correctly, idempotency on retry, cursor advances correctly, conflict flags surface.
- **Referral guardrail:** test every severe threshold combination; assert engine returns `ReferralRequired`, not a plan.
- **Clinical validation (non-automated):** a health teammate (nutrition officer or UDS contact) must review all thresholds and sample plans against WHO/GHS guidance before any field use. This is a safety gate.
- **Device:** test on at least one genuine low-end Android device (Android 8+, ~2 GB RAM).

---

## Responsible AI Checklist

Before any AI feature ships:

- [ ] LLM output validated against deterministic plan before use
- [ ] Fallback to template on validation failure or LLM unavailability
- [ ] No PII sent to LLM
- [ ] Every LLM call logged with input, model, version, and output hash
- [ ] Human worker reviews every plan before it reaches a caregiver
- [ ] Severe-case guardrail bypasses AI entirely

---

## Non-Functional Targets

- **Target device:** Android 8+, ~2 GB RAM. APK < 30 MB. Voice packs < 15 MB per language.
- **On-device storage cap:** 250 MB total; auto-clear old audio cache below 10% free.
- **Recommendation generation:** < 1 s on-device.
- **List/record screens:** instant from local SQLite (no network wait).
- **Audio encoding:** AAC-HE or Opus, 32 kbps mono.
- **Accessibility:** large tap targets (≥ 48 dp), icon support, sun-readable contrast, voice output.

---

## Hackathon Timeline

| Date | Milestone |
| --- | --- |
| 11 Aug 2026 | Application deadline |
| Aug (virtual) | Pre-workshops (attend if possible) |
| 26 Aug 2026 | Bootcamp Day 1 — Tamale: lock scope, offline register + visit capture |
| 27 Aug 2026 | Bootcamp Day 2: recommendation engine, sync, voice note, explainable UI |
| 28 Aug 2026 | Bootcamp Day 3: polish, demo path, pitch |

**Before bootcamp:** scaffold repo, seed one pilot district's food + seasonal data (validated with a nutrition contact), record a handful of Dagbani audio phrases, convert prototype to RN screen skeleton.
