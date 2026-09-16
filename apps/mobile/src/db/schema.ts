/**
 * On-device SQLite schema (@op-engineering/op-sqlite + SQLCipher).
 * Mirrors the server PostgreSQL schema for client-writable entities.
 * Reference data tables are populated from downloaded bundles (read-only).
 */

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── Client-writable ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL,
  label TEXT NOT NULL,
  community TEXT NOT NULL,
  geo TEXT,
  notes TEXT,
  phone TEXT,
  landmark TEXT,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  type TEXT NOT NULL CHECK(type IN ('pregnant', 'child')),
  name TEXT NOT NULL,
  dob TEXT,
  edd_gestation TEXT,
  sex TEXT,
  anc_folder_number TEXT,
  cwc_card_number TEXT,
  caregiver_name TEXT,
  caregiver_relationship TEXT,
  gravida TEXT,
  parity TEXT,
  lmp TEXT,
  consent_at TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  user_id TEXT NOT NULL,
  visited_at TEXT NOT NULL,
  weight_kg REAL,
  hb_g_dl REAL,
  muac_mm REAL,
  diet_recall TEXT NOT NULL,  -- JSON array of food group codes
  danger_signs TEXT,          -- JSON array of danger sign codes
  notes TEXT,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS flags (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  visit_id TEXT NOT NULL REFERENCES visits(id),
  severity TEXT NOT NULL CHECK(severity IN ('ok', 'watch', 'refer')),
  reasons TEXT NOT NULL,      -- JSON
  computed_at TEXT NOT NULL,
  reference_bundle_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  visit_id TEXT NOT NULL REFERENCES visits(id),
  season_month INTEGER NOT NULL,
  district TEXT NOT NULL,
  target_nutrients TEXT NOT NULL,  -- JSON
  foods TEXT NOT NULL,             -- JSON
  adequacy TEXT NOT NULL,          -- JSON
  rationale TEXT NOT NULL,         -- JSON
  voice_script TEXT,
  voice_pack_id TEXT,
  ai_enriched INTEGER NOT NULL DEFAULT 0,
  reference_bundle_version TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  visit_id TEXT NOT NULL REFERENCES visits(id),
  reason TEXT NOT NULL,
  flag_codes TEXT NOT NULL,   -- JSON
  facility_to TEXT,
  status TEXT NOT NULL DEFAULT 'issued',
  queued_offline INTEGER NOT NULL DEFAULT 1,
  issued_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);

-- ── Sync support ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idempotency_key TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('insert', 'update', 'delete')),
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL   -- Unix ms
);

CREATE TABLE IF NOT EXISTS sync_state (
  table_name TEXT PRIMARY KEY,
  last_cursor TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ── Reference data (read-only, from bundles) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  local_names TEXT NOT NULL,    -- JSON: { "dagbani": "zogale" }
  food_group TEXT NOT NULL,
  nutrients TEXT NOT NULL,      -- JSON
  affordability_tier TEXT NOT NULL,
  storable INTEGER NOT NULL DEFAULT 0,
  garden_wild INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS seasonal_availability (
  id TEXT PRIMARY KEY,
  agro_zone_id TEXT NOT NULL,
  month INTEGER NOT NULL,
  food_id TEXT NOT NULL REFERENCES foods(id),
  availability TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nutrient_targets (
  id TEXT PRIMARY KEY,
  profile TEXT NOT NULL,
  nutrient TEXT NOT NULL,
  daily_target REAL NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clinical_thresholds (
  id TEXT PRIMARY KEY,
  metric TEXT NOT NULL,
  condition TEXT NOT NULL,
  severity TEXT NOT NULL,
  threshold_value REAL NOT NULL,
  threshold_direction TEXT NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS voice_packs (
  id TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  version TEXT NOT NULL,
  phrases TEXT NOT NULL,       -- JSON
  template_map TEXT NOT NULL   -- JSON
);

-- ── Telemetry ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS telemetry_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload TEXT,
  created_at INTEGER NOT NULL,
  synced_at INTEGER
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_visits_client ON visits(client_id);
CREATE INDEX IF NOT EXISTS idx_flags_client ON flags(client_id);
CREATE INDEX IF NOT EXISTS idx_plans_client ON plans(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);
CREATE INDEX IF NOT EXISTS idx_seasonal_zone_month ON seasonal_availability(agro_zone_id, month);

-- ── Schema migrations — safe to run on existing DBs (errors are caught in initDb) ──
ALTER TABLE households ADD COLUMN phone TEXT;
ALTER TABLE households ADD COLUMN landmark TEXT;
ALTER TABLE clients ADD COLUMN anc_folder_number TEXT;
ALTER TABLE clients ADD COLUMN cwc_card_number TEXT;
ALTER TABLE clients ADD COLUMN caregiver_name TEXT;
ALTER TABLE clients ADD COLUMN caregiver_relationship TEXT;
ALTER TABLE clients ADD COLUMN gravida TEXT;
ALTER TABLE clients ADD COLUMN parity TEXT;
ALTER TABLE clients ADD COLUMN lmp TEXT;
`;
