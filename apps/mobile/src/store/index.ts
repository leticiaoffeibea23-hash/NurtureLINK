/**
 * NurtureLink — Zustand app store.
 *
 * This store drives both the live app state and the demo seed data used for
 * the prototype. Real persistence (SQLCipher) and sync are wired separately;
 * for the hackathon demo everything lives in memory.
 */
import { create } from 'zustand';
import * as Battery from 'expo-battery';
import * as FileSystem from 'expo-file-system';
import { loadReferenceBundle } from '../db/bundle-loader';
import { clearSession, getToken } from '../auth/session';
import { persistClient, persistVisit, persistReferral, uuidv4 } from '../db/persist';
import { syncNow } from '../sync/orchestrator';
import type { ReferenceBundle, PlanInput, EngineFlag, PlanResult } from '../engine/types';
import { generatePlan } from '../engine';
import { NUTRIENT_LABELS } from '../engine/rationale';
import type { FlagCode } from '@nurturelink/shared';

// ─── Domain types (local, demo-optimised) ────────────────────────────────────

export type ClientType = 'pregnant' | 'child';
export type Priority = 'urgent' | 'high' | 'stable' | 'new';
export type TrendArrow = 'up' | 'down' | 'flat';
export type UiLang = 'en' | 'dag';
export type Role = 'cho' | 'sup';
export type ReferralStatus = 'issued' | 'seen';
export type NotifKind = 'referral' | 'risk' | 'sync' | 'bundle' | 'voice';
export type NotifGroup = 'today' | 'earlier';

export interface ChoActivity {
  id: string;
  name: string;
  zone: string;
  clients: number;
  visited: number;
  pending: number;
  lastSync: string;
  synced: boolean;
}

export interface DemoVisit {
  date: string;
  weight: number;
  hb: number | null;
  muac: number;
  diet: string[];
  danger: string[];
  synced: boolean;
  owner: string;
}

export interface DemoClient {
  id: string;
  name: string;
  type: ClientType;
  age: string | number;
  community: string;
  caregiver: string;
  phone?: string;
  priority: Priority;
  metric: 'hb' | 'weight' | 'muac';
  severe: boolean;
  referred: boolean;
  flag: string;
  flagDetail: string;
  trendNote: string;
  trendArrow: TrendArrow;
  trendColor: string;
  visits: DemoVisit[];
  // POST-HACKATHON additions
  lifestage?: string;        // 'pregnant' | 'postpartum' | 'lactating'
  linkedClientId?: string;   // linked mother (for child) or child (for mother)
}

export interface VaccineRecord {
  id: string;
  vaccineId: string;
  givenAt: string;             // YYYY-MM-DD
  batchNumber?: string;
  aefi?: string;               // adverse event description
  aefiSeverity?: 'mild' | 'moderate' | 'severe';
}

export interface DemoReferral {
  id: string;
  clientId: string;
  name: string;
  type: ClientType;
  reason: string;
  facility: string;
  phone?: string;
  status: ReferralStatus;
  at: string;
  seenAt?: string;
  due?: string;
  // G7: enriched confirmation data
  confirmSource?: string;
  outcome?: string;
  nextFollowUp?: string;
}

export interface AppNotification {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  time: string;
  read: boolean;
  group: NotifGroup;
  target: string;
}

export interface PlanData {
  seasonNote: string;
  targetNote: string;
  foods: PlanFood[];
  alternates: PlanFood[];
  adequacy: { label: string; pct: number }[];
  rationale: string[];
  voiceEn: string;
  voiceDag: string;
}

export interface PlanFood {
  name: string;
  local: string;
  group: string;
  tier: string;
  why: string;
}

export interface VisitForm {
  // Always present
  weight: string;
  hb: string;
  muac: string;
  diet: string[];
  danger: string[];
  // Children only (all ages)
  heightCm: string;
  oedema: string;               // 'yes' | 'no' | ''
  // Pregnant only
  bpSystolic: string;
  bpDiastolic: string;
  ancVisited: string;           // 'yes' | 'no' | ''
  supplementGiven: string;      // 'yes' | 'no' | ''
  // Child 0–5 mo
  exclusiveBreastfeeding: string; // 'yes' | 'no' | ''
  feedingDifficulty: string;    // 'yes' | 'no' | ''
  // Child 6–23 mo
  mealFreqPerDay: string;
  feedingTexture: string;       // 'smooth' | 'mashed' | 'lumpy' | 'family' | ''
  feedingDuringIllness: string; // 'yes' | 'no' | ''
  // Child 6–59 mo (Vitamin A)
  vitaminAGiven: string;        // 'yes' | 'no' | ''
  // Newborn only (< 1 month)
  cordCondition: string;        // 'yes' | 'no' | '' (yes = normal cord)
  jaundice: string;             // 'yes' | 'no' | ''
  breastfeedInitiated: string;  // 'yes' | 'no' | ''
}

export interface RegForm {
  type: ClientType;
  name: string;
  sex: string;          // 'Male' | 'Female' | ''
  region: string;
  district: string;
  community: string;
  dob: string;          // child's DOB or mother's DOB (YYYY-MM-DD)
  consent: boolean;
  // Household contact (both types)
  phone: string;
  landmark: string;
  // Pregnant-specific
  edd: string;          // expected delivery date (YYYY-MM-DD)
  lmp: string;          // last menstrual period (YYYY-MM-DD)
  ancFolderNumber: string;
  gravida: string;
  parity: string;
  // Child-specific
  cwcCardNumber: string;
  caregiverName: string;
  caregiverRelationship: string;
  // POST-HACKATHON additions
  lifestage: string;            // 'pregnant' | 'postpartum' | 'lactating'
  linkedClientId: string;       // mother's client ID (for child registration)
}

// Plans are generated per-client by the AI layer and stored in state.
// The PlanScreen falls back to a generic template if no plan is available.
export const PLANS: Record<string, PlanData> = {};

// ─── Engine helpers ───────────────────────────────────────────────────────────

const TIER_DISPLAY: Record<string, string> = {
  staple_cheap: 'Low cost',
  market: 'Market',
  premium: 'Premium',
};

const REASON_DISPLAY: Record<string, string> = {
  in_season_abundant:   'Abundant in season now',
  in_season_available:  'Available in season',
  storable_year_round:  'Can be dried and stored year-round',
  garden_or_wild:       'Available from kitchen garden or wild',
  affordable_staple:    'Affordable staple food',
  affordable_market:    'Available at local market',
  closes_ironMg_gap:    'Helps close iron gap',
  closes_folateUg_gap:  'Helps close folate gap',
  closes_proteinG_gap:  'Good source of protein',
  closes_energyKcal_gap:'Good energy source',
  closes_vitAUgRae_gap: 'Rich in Vitamin A',
  closes_zincMg_gap:    'Good source of zinc',
};

/** Parse a DemoClient's age field into months for the engine. */
function parseAgeMonths(client: DemoClient): number | undefined {
  if (client.type === 'pregnant') return undefined;
  const age = client.age;
  if (typeof age === 'number') return age * 12;
  if (typeof age === 'string') {
    const moMatch = age.match(/^(\d+)\s*mo/);
    if (moMatch) return parseInt(moMatch[1], 10);
    const yrMatch = age.match(/^(\d+)/);
    if (yrMatch) return parseInt(yrMatch[1], 10) * 12;
  }
  return 12;
}

/**
 * Look up a clinical threshold value from the reference bundle.
 * Returns null when the bundle is not loaded — callers must supply a safe fallback.
 */
function getThreshold(
  bundle: ReferenceBundle | null,
  metric: string,
  condition: string,
  severity: string,
): number | null {
  if (!bundle) return null;
  const row = bundle.clinicalThresholds.find(
    (t) => t.metric === metric && t.condition === condition && t.severity === severity,
  );
  return row?.thresholdValue ?? null;
}

/** Map a PlanResult from the engine to the PlanData shape PlanScreen expects. */
function planResultToPlanData(result: PlanResult, client: DemoClient): PlanData {
  const monthName = new Date().toLocaleString('en-US', { month: 'long' });
  const nutrientLabels = result.targetNutrients
    .map((n) => NUTRIENT_LABELS[n] ?? n)
    .join(', ');

  const foods: PlanFood[] = result.selectedFoods.map((f) => ({
    name: f.name,
    local: f.localName,
    group: f.foodGroup,
    tier: TIER_DISPLAY[f.tier] ?? f.tier,
    why: f.reasons
      .slice(0, 2)
      .map((r) => REASON_DISPLAY[r] ?? r)
      .join('. '),
  }));

  const adequacy = Object.entries(result.adequacy).map(([key, val]) => ({
    label: (NUTRIENT_LABELS as Record<string, string>)[key] ?? key,
    pct: Math.round((val ?? 0) * 100),
  }));

  const rationale = result.rationale.map((entry) => {
    const food = result.selectedFoods.find((f) => f.id === entry.foodId);
    const topReason = entry.reasons[0];
    return `${food?.name ?? entry.foodId}: ${REASON_DISPLAY[topReason ?? ''] ?? topReason ?? ''}`;
  });

  return {
    seasonNote: `In season · ${monthName} · Northern Savannah`,
    targetNote: `${client.name}'s plan targets ${nutrientLabels} using locally available, affordable foods.`,
    foods,
    alternates: [],
    adequacy,
    rationale,
    voiceEn: result.voiceScriptTemplate,
    voiceDag: result.voiceScriptTemplate,
  };
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8181';

// ─── Server response types (used in loadUserData) ─────────────────────────────

interface ServerClient {
  id: string;
  householdId: string;
  type: 'pregnant' | 'child';
  name: string;
  dob: string | null;
  eddGestation: string | null;
  sex: 'M' | 'F' | 'unknown' | null;
  consentAt: string;
  active: boolean;
  updatedAt: string;
  community: string;
}

interface ServerReferral {
  id: string;
  clientId: string;
  visitId: string;
  reason: string;
  flagCodes: string[];
  facilityTo: string | null;
  status: string;
  issuedAt: string;
  updatedAt: string;
}

function ageFromDob(dob: string | null, type: 'pregnant' | 'child'): string | number {
  if (!dob) return type === 'pregnant' ? '—' : 'new';
  const months = Math.round((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (type === 'child') {
    if (months < 24) return `${months} mo`;
    return Math.floor(months / 12);
  }
  return Math.round(months / 12);
}

function serverClientToDemoClient(c: ServerClient): DemoClient {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    age: ageFromDob(c.dob, c.type),
    community: c.community,
    caregiver: c.name,
    priority: 'new',
    metric: c.type === 'pregnant' ? 'hb' : 'muac',
    severe: false,
    referred: false,
    flag: 'New client · awaiting first visit',
    flagDetail: '',
    trendNote: '',
    trendArrow: 'flat',
    trendColor: '#427CAF',
    visits: [],
  };
}

function serverReferralToDemoReferral(
  r: ServerReferral,
  clientMap: Map<string, DemoClient>,
): DemoReferral {
  const client = clientMap.get(r.clientId);
  const isActive = r.status === 'issued' || r.status === 'in_transit';
  return {
    id: r.id,
    clientId: r.clientId,
    name: client?.name ?? 'Unknown client',
    type: client?.type ?? 'child',
    reason: r.reason,
    facility: r.facilityTo ?? 'Referral facility',
    status: isActive ? 'issued' : 'seen',
    at: new Date(r.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
}

// ─── Store state shape ────────────────────────────────────────────────────────

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  phone: string;
  role: Role;
  facilityName: string | null;
  facilityDistrict: string | null;
  facilityRegion: string | null;
  avatarUri: string | null;
}

export type ProfileEditable = Pick<CurrentUser, 'firstName' | 'lastName' | 'otherNames' | 'phone' | 'avatarUri'>;

/** Display-friendly full name: First [Other] Last */
export function displayName(user: Pick<CurrentUser, 'firstName' | 'lastName' | 'otherNames'>): string {
  return [user.firstName, user.otherNames, user.lastName].filter(Boolean).join(' ');
}

interface StoreState {
  // Auth
  role: Role;
  isLoggedIn: boolean;
  sessionExpired: boolean;
  uiLang: UiLang;
  currentUser: CurrentUser | null;

  // Data
  clients: DemoClient[];
  referrals: DemoReferral[];
  notifications: AppNotification[];
  dataLoading: boolean;

  // Supervisor
  choActivity: ChoActivity[];
  supervisorLoading: boolean;

  // Plan edits (removed / added alternates per client)
  planEdits: Record<string, { removed: string[]; added: string[] }>;
  // AI-generated plans per client (keyed by clientId)
  plans: Record<string, PlanData>;

  // Voice / audio
  voiceLang: UiLang;
  audioPlaying: boolean;
  audioT: number;        // 0–38 playback ticks
  recording: boolean;
  recorded: boolean;
  recordT: number;

  // Reference bundle (loaded from SQLite at startup; null until first download)
  referenceBundle: ReferenceBundle | null;
  loadBundle: () => Promise<void>;

  // Device / sync
  offline: boolean;
  syncing: boolean;
  lastSyncAt: string | null;     // ISO string of most recent completed sync
  adaptiveSync: boolean;
  battery: number;
  storageUsed: number;
  telemetryCount: number;
  pendingRecords: number;

  // Forms
  visitForm: VisitForm;
  regForm: RegForm;

  // Actions — auth
  login: (user: CurrentUser) => void;
  logout: () => void;
  setSessionExpired: (v: boolean) => void;
  setUiLang: (lang: UiLang) => void;
  loadUserData: (accessToken: string) => Promise<void>;
  loadSupervisorData: () => Promise<void>;
  updateProfile: (fields: Partial<ProfileEditable>) => void;

  // Actions — clients
  addClient: (c: DemoClient) => void;
  patchClient: (id: string, patch: Partial<DemoClient>) => void;

  // Actions — visits
  resetVisitForm: () => void;
  setVisitField: (k: keyof VisitForm, v: string | string[]) => void;
  toggleDiet: (id: string) => void;
  toggleDanger: (id: string) => void;
  saveVisit: (clientId: string) => 'plan' | 'referral';

  // Actions — registration
  setRegField: (k: keyof RegForm, v: string | boolean) => void;
  saveClient: () => DemoClient | null;

  // Actions — plan
  removePlanFood: (clientId: string, name: string) => void;
  addPlanAlternate: (clientId: string) => string | null;
  regeneratePlan: () => void;
  setVoiceLang: (lang: UiLang) => void;

  // Actions — audio
  setAudioT: (t: number) => void;
  setAudioPlaying: (v: boolean) => void;
  setRecording: (v: boolean) => void;
  setRecorded: (v: boolean) => void;
  setRecordT: (t: number) => void;

  // Immunization records
  immunizations: Record<string, VaccineRecord[]>;
  saveVaccineRecord: (clientId: string, record: VaccineRecord) => void;

  // Actions — referrals
  issueReferral: (clientId: string) => void;
  confirmReferralSeen: (clientId: string, details?: { seenAt: string; confirmSource: string; outcome: string; nextFollowUp?: string }) => void;

  // Actions — notifications
  markAllRead: () => void;
  markNotifRead: (id: string) => void;

  // Actions — sync
  sync: () => void;
  toggleOffline: () => void;
  toggleAdaptive: () => void;
  refreshDeviceStats: () => Promise<void>;

  // Demo
  seedDemoData: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

const emptyVisitForm: VisitForm = {
  weight: '', hb: '', muac: '', diet: [], danger: [],
  heightCm: '', oedema: '',
  bpSystolic: '', bpDiastolic: '', ancVisited: '', supplementGiven: '',
  exclusiveBreastfeeding: '', feedingDifficulty: '',
  mealFreqPerDay: '', feedingTexture: '', feedingDuringIllness: '',
  vitaminAGiven: '',
  cordCondition: '', jaundice: '', breastfeedInitiated: '',
};
const emptyRegForm: RegForm = {
  type: 'child',
  name: '',
  sex: '',
  region: '',
  district: '',
  community: '',
  dob: '',
  consent: false,
  phone: '',
  landmark: '',
  edd: '',
  lmp: '',
  ancFolderNumber: '',
  gravida: '',
  parity: '',
  cwcCardNumber: '',
  caregiverName: '',
  caregiverRelationship: '',
  lifestage: '',
  linkedClientId: '',
};

export const useAppStore = create<StoreState>((set, get) => ({
  // Initial state
  role: 'cho',
  isLoggedIn: false,
  sessionExpired: false,
  uiLang: 'en',
  currentUser: null,

  clients: [],
  referrals: [],
  notifications: [],
  dataLoading: false,

  choActivity: [],
  supervisorLoading: false,

  planEdits: {},
  plans: {},

  voiceLang: 'en',
  audioPlaying: false,
  audioT: 0,
  recording: false,
  recorded: false,
  recordT: 0,

  referenceBundle: null,
  loadBundle: async () => {
    const bundle = await loadReferenceBundle();
    if (bundle) set({ referenceBundle: bundle });
  },

  immunizations: {},
  offline: true,
  syncing: false,
  lastSyncAt: null,
  adaptiveSync: true,
  battery: 62,
  storageUsed: 148,
  telemetryCount: 14,
  pendingRecords: 3,

  visitForm: emptyVisitForm,
  regForm: emptyRegForm,

  // ── Auth ──
  login: (user) => set({ isLoggedIn: true, role: user.role, currentUser: user, sessionExpired: false }),
  logout: () => {
    clearSession().catch(() => {});
    set({ isLoggedIn: false, currentUser: null, clients: [], referrals: [], notifications: [], sessionExpired: false });
  },
  setSessionExpired: (v) => set({ sessionExpired: v }),
  setUiLang: (lang) => set({ uiLang: lang }),
  updateProfile: (fields) => set((s) => ({
    currentUser: s.currentUser ? { ...s.currentUser, ...fields } : s.currentUser,
  })),

  loadUserData: async (accessToken: string) => {
    set({ dataLoading: true });
    const headers = { Authorization: `Bearer ${accessToken}` };
    try {
      const [clientsRes, referralsRes] = await Promise.all([
        fetch(`${API_URL}/clients`, { headers }),
        fetch(`${API_URL}/referrals`, { headers }),
      ]);

      const clientsJson = clientsRes.ok ? await clientsRes.json() : { clients: [] };
      const referralsJson = referralsRes.ok ? await referralsRes.json() : { referrals: [] };

      const serverClients: ServerClient[] = clientsJson.clients ?? [];
      const serverReferrals: ServerReferral[] = referralsJson.referrals ?? [];

      const clientMap = new Map<string, DemoClient>();
      const demoClients: DemoClient[] = serverClients.map((c) => {
        const dc = serverClientToDemoClient(c);
        clientMap.set(c.id, dc);
        return dc;
      });

      // Mark clients that have an active referral
      const referredIds = new Set(
        serverReferrals
          .filter((r) => r.status === 'issued' || r.status === 'in_transit')
          .map((r) => r.clientId),
      );
      for (const dc of demoClients) {
        if (referredIds.has(dc.id)) dc.referred = true;
      }

      const demoReferrals: DemoReferral[] = serverReferrals.map((r) =>
        serverReferralToDemoReferral(r, clientMap),
      );

      set({ clients: demoClients, referrals: demoReferrals, dataLoading: false, offline: false, pendingRecords: 0 });
    } catch (e) {
      console.warn('[Store] loadUserData error:', e);
      set({ dataLoading: false });
    }
  },

  loadSupervisorData: async () => {
    set({ supervisorLoading: true });
    try {
      const token = await getToken();
      if (!token || token.startsWith('demo.')) {
        set({ supervisorLoading: false });
        return;
      }
      const res = await fetch(`${API_URL}/supervisor/chos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        set({ choActivity: json.chos ?? [] });
      }
    } catch (e) {
      console.warn('[Store] loadSupervisorData error:', e);
    } finally {
      set({ supervisorLoading: false });
    }
  },

  // ── Clients ──
  addClient: (c) => set((s) => ({ clients: [...s.clients, c] })),
  patchClient: (id, patch) =>
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

  // ── Visit form ──
  resetVisitForm: () => set({ visitForm: emptyVisitForm }),
  setVisitField: (k, v) => set((s) => ({ visitForm: { ...s.visitForm, [k]: v } })),
  toggleDiet: (id) =>
    set((s) => {
      const d = s.visitForm.diet;
      return { visitForm: { ...s.visitForm, diet: d.includes(id) ? d.filter((x) => x !== id) : [...d, id] } };
    }),
  toggleDanger: (id) =>
    set((s) => {
      const d = s.visitForm.danger;
      return { visitForm: { ...s.visitForm, danger: d.includes(id) ? d.filter((x) => x !== id) : [...d, id] } };
    }),

  saveVisit: (clientId) => {
    const { visitForm, clients, referenceBundle } = get();
    const client = clients.find((c) => c.id === clientId);
    if (!client) return 'plan';

    const muac = parseFloat(visitForm.muac) || 0;
    const hb = visitForm.hb ? parseFloat(visitForm.hb) : null;
    const clientCondition = client.type === 'pregnant' ? 'pregnant' : 'child';

    // Thresholds from reference bundle; safe fallbacks match WHO seeded values
    const muacReferThreshold = getThreshold(referenceBundle, 'muac_mm', 'child', 'refer') ?? 115;
    const muacWatchThreshold = getThreshold(referenceBundle, 'muac_mm', 'child', 'watch') ?? 125;
    const hbReferThreshold   = getThreshold(referenceBundle, 'hb_g_dl', clientCondition, 'refer') ?? 7.0;
    const hbWatchThreshold   = getThreshold(referenceBundle, 'hb_g_dl', clientCondition, 'watch') ?? (clientCondition === 'pregnant' ? 11.0 : 10.0);

    const severe =
      visitForm.danger.length > 0 ||
      (muac > 0 && muac < muacReferThreshold) ||
      (hb !== null && hb > 0 && hb < hbReferThreshold);

    const lastVisit = client.visits[client.visits.length - 1];
    const today = new Date();
    const todayLabel = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const newVisit: DemoVisit = {
      date: todayLabel,
      weight: parseFloat(visitForm.weight) || lastVisit?.weight || 0,
      hb: hb !== null ? hb : null,
      muac: muac || 235,
      diet: visitForm.diet,
      danger: visitForm.danger,
      synced: false,
      owner: 'You',
    };

    const patch: Partial<DemoClient> = { visits: [...client.visits, newVisit] };

    let severity: 'ok' | 'watch' | 'refer' = 'ok';
    const flagReasons: Array<{ code: string; value?: number }> = [];

    if (severe) {
      severity = 'refer';
      patch.severe = true;
      patch.priority = 'urgent';
      patch.flag = 'Danger sign — referral needed';
      if (visitForm.danger.length > 0) {
        patch.flagDetail = 'Danger sign recorded at this visit';
        flagReasons.push({ code: 'DANGER_SIGNS' });
      } else if (muac > 0 && muac < muacReferThreshold) {
        patch.flagDetail = `MUAC ${Math.round(muac)} mm — below the ${muacReferThreshold} mm threshold`;
        flagReasons.push({ code: 'SEVERE_MUAC', value: muac });
      } else {
        patch.flagDetail = `Hb below the severe-anaemia threshold (${hbReferThreshold} g/dL)`;
        flagReasons.push({ code: 'SEVERE_ANAEMIA', value: hb ?? undefined });
      }
      patch.trendColor = '#C81E1E';
      patch.trendArrow = 'down';
      patch.trendNote = 'Danger sign — needs clinical care';
    } else {
      if (muac > 0 && muac < muacWatchThreshold) { severity = 'watch'; flagReasons.push({ code: 'SEVERE_MUAC', value: muac }); }
      if (hb !== null && hb > 0 && hb < hbWatchThreshold) { severity = 'watch'; flagReasons.push({ code: 'FALLING_HB', value: hb }); }
      if (client.priority === 'new') patch.priority = 'stable';
    }

    get().patchClient(clientId, patch);
    set((s) => ({ telemetryCount: s.telemetryCount + 1, pendingRecords: s.pendingRecords + 1 }));

    // ── Run recommendation engine (synchronous, on-device, pure) ─────────────
    if (!severe) {
      const { referenceBundle } = get();
      if (referenceBundle) {
        const engineFlags: EngineFlag[] = flagReasons.map((f) => ({
          code: f.code as FlagCode,
          value: f.value,
        }));
        const agroZoneId =
          referenceBundle.seasonalAvailability[0]?.agroZoneId ??
          'a1b2c3d4-0000-0000-0000-000000000001';
        const planInput: PlanInput = {
          clientType: client.type,
          ageMonths: parseAgeMonths(client),
          flags: engineFlags,
          agroZoneId,
          currentMonth: new Date().getMonth() + 1,
          affordabilityCeiling: 'staple_cheap',
        };
        const engineResult = generatePlan(planInput, referenceBundle);
        if (engineResult.kind === 'plan') {
          const planData = planResultToPlanData(engineResult, client);
          set((s) => ({ plans: { ...s.plans, [clientId]: planData } }));
        }
      }
    }

    // Persist visit + flag to SQLite + outbox (fire-and-forget)
    const visitId = uuidv4();
    const flagId = uuidv4();
    // Serialize type-specific clinical fields into notes JSON
    const clinicalExtras: Record<string, string> = {};
    for (const k of ['heightCm','oedema','bpSystolic','bpDiastolic','ancVisited',
      'supplementGiven','exclusiveBreastfeeding','feedingDifficulty','mealFreqPerDay',
      'feedingTexture','feedingDuringIllness','vitaminAGiven',
      'cordCondition','jaundice','breastfeedInitiated'] as const) {
      const v = visitForm[k as keyof VisitForm] as string;
      if (v) clinicalExtras[k] = v;
    }
    persistVisit(
      {
        visitId,
        clientId,
        visitedAt: new Date().toISOString(),
        weightKg: parseFloat(visitForm.weight) || null,
        hbGDl: visitForm.hb ? parseFloat(visitForm.hb) : null,
        muacMm: muac || null,
        dietRecall: visitForm.diet,
        dangerSigns: visitForm.danger,
        notes: Object.keys(clinicalExtras).length > 0 ? JSON.stringify(clinicalExtras) : null,
      },
      { flagId, clientId, visitId, severity, reasons: flagReasons },
    ).catch((e) => console.warn('[Store] persistVisit error:', e));

    return severe ? 'referral' : 'plan';
  },

  // ── Registration ──
  setRegField: (k, v) => set((s) => ({ regForm: { ...s.regForm, [k]: v } })),
  saveClient: () => {
    const { regForm } = get();
    if (!regForm.name.trim() || !regForm.consent) return null;
    const id = uuidv4();
    const now = new Date().toISOString();
    const nc: DemoClient = {
      id,
      name: regForm.name.trim(),
      type: regForm.type,
      age: regForm.type === 'child' ? 'new' : '—',
      community: regForm.community,
      caregiver: regForm.type === 'child'
        ? (regForm.caregiverName.trim() || regForm.name.trim())
        : regForm.name.trim(),
      priority: 'new',
      metric: 'weight',
      severe: false,
      referred: false,
      flag: 'New client · awaiting first visit',
      flagDetail: '',
      trendNote: '',
      trendArrow: 'flat',
      trendColor: '#427CAF',
      visits: [],
      lifestage: regForm.lifestage || undefined,
      linkedClientId: regForm.linkedClientId || undefined,
    };
    get().addClient(nc);
    // Bidirectional link: update the linked mother/child to point back
    if (regForm.linkedClientId) {
      get().patchClient(regForm.linkedClientId, { linkedClientId: id });
    }
    set({ regForm: emptyRegForm });

    // Persist to SQLite + outbox (fire-and-forget)
    persistClient({
      clientId: id,
      name: nc.name,
      type: nc.type,
      sex: regForm.sex || null,
      community: nc.community,
      dob: regForm.dob || null,
      edd: regForm.edd || null,
      lmp: regForm.lmp || null,
      consentAt: now,
      phone: regForm.phone.trim() || null,
      landmark: regForm.landmark.trim() || null,
      ancFolderNumber: regForm.ancFolderNumber.trim() || null,
      gravida: regForm.gravida.trim() || null,
      parity: regForm.parity.trim() || null,
      cwcCardNumber: regForm.cwcCardNumber.trim() || null,
      caregiverName: regForm.caregiverName.trim() || null,
      caregiverRelationship: regForm.caregiverRelationship || null,
    }).catch((e) => console.warn('[Store] persistClient error:', e));

    return nc;
  },

  // ── Plan ──
  removePlanFood: (clientId, name) =>
    set((s) => {
      const e = s.planEdits[clientId] ?? { removed: [], added: [] };
      return { planEdits: { ...s.planEdits, [clientId]: { ...e, removed: [...e.removed, name] } } };
    }),
  addPlanAlternate: (clientId) => {
    const { planEdits, plans } = get();
    const e = planEdits[clientId] ?? { removed: [], added: [] };
    const plan = plans[clientId] ?? PLANS[clientId];
    if (!plan) return null;
    const next = plan.alternates.find((a) => !e.added.includes(a.name));
    if (!next) return null;
    set((s) => ({
      planEdits: { ...s.planEdits, [clientId]: { ...e, added: [...e.added, next.name] } },
    }));
    return next.name;
  },
  regeneratePlan: () => set((s) => ({ telemetryCount: s.telemetryCount + 1 })),
  setVoiceLang: (lang) => set({ voiceLang: lang }),

  // ── Audio ──
  setAudioT: (t) => set({ audioT: t }),
  setAudioPlaying: (v) => set({ audioPlaying: v }),
  setRecording: (v) => set({ recording: v }),
  setRecorded: (v) => set({ recorded: v }),
  setRecordT: (t) => set({ recordT: t }),

  // ── Referrals ──
  issueReferral: (clientId) => {
    const client = get().clients.find((c) => c.id === clientId);
    if (!client) return;
    const referralId = uuidv4();
    const now = new Date();
    const atLabel  = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const dueDate  = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const dueLabel = dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const ref: DemoReferral = {
      id: referralId,
      clientId,
      name: client.name,
      type: client.type,
      reason: client.flagDetail,
      facility: 'Tamale West Hospital',
      phone: client.phone,
      status: 'issued',
      at: atLabel,
      due: dueLabel,
    };
    get().patchClient(clientId, { referred: true });
    set((s) => ({ referrals: [...s.referrals, ref], telemetryCount: s.telemetryCount + 1 }));

    // Persist + emergency sync (fire-and-forget)
    const visitId = uuidv4(); // placeholder — real flow uses the actual visit UUID
    persistReferral({
      referralId,
      clientId,
      visitId,
      reason: client.flagDetail,
      flagCodes: client.severe ? ['DANGER_SIGNS'] : [],
    })
      .then(() => syncNow('referral_emergency'))
      .catch((e) => console.warn('[Store] issueReferral persist error:', e));
  },
  confirmReferralSeen: (clientId, details) =>
    set((s) => ({
      referrals: s.referrals.map((r) =>
        r.clientId === clientId
          ? {
              ...r,
              status: 'seen',
              seenAt: details?.seenAt ?? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              confirmSource: details?.confirmSource,
              outcome: details?.outcome,
              nextFollowUp: details?.nextFollowUp,
            }
          : r,
      ),
    })),

  // ── Immunizations ──
  saveVaccineRecord: (clientId, record) =>
    set((s) => ({
      immunizations: {
        ...s.immunizations,
        [clientId]: [
          ...(s.immunizations[clientId] ?? []).filter((r) => r.vaccineId !== record.vaccineId),
          record,
        ],
      },
    })),

  // ── Notifications ──
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  markNotifRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  // ── Sync ──
  sync: () => {
    const { syncing } = get();
    if (syncing) return;
    set({ syncing: true });
    syncNow('foreground')
      .catch((err) => console.error('[Store] Sync error', err))
      .finally(() => {
        set({ syncing: false, lastSyncAt: new Date().toISOString() });
      });
  },
  toggleOffline: () => set((s) => ({ offline: !s.offline })),
  toggleAdaptive: () => set((s) => ({ adaptiveSync: !s.adaptiveSync })),

  refreshDeviceStats: async () => {
    try {
      const [batteryLevel, dirInfo] = await Promise.all([
        Battery.getBatteryLevelAsync(),
        FileSystem.getInfoAsync(FileSystem.documentDirectory ?? '', { size: true }),
      ]);
      const batteryPct = Math.round(batteryLevel * 100);
      const usedBytes = dirInfo.exists ? (dirInfo as { size?: number }).size ?? 0 : 0;
      const usedMB = Math.round(usedBytes / (1024 * 1024));
      set({ battery: batteryPct, storageUsed: Math.min(usedMB, 250) });
    } catch {
      // Leave existing values if device APIs are unavailable (e.g. web/simulator)
    }
  },

  seedDemoData: () => {
    const demoUser: CurrentUser = {
      id: 'demo-cho-001',
      firstName: 'Abubakari',
      lastName: 'Sulemana',
      otherNames: null,
      phone: '+233244000001',
      role: 'cho',
      facilityName: 'Kukuo CHPS Compound',
      facilityDistrict: 'Sagnarigu Municipal',
      facilityRegion: 'Northern Region',
      avatarUri: null,
    };

    // Client IDs match RANK_SIGNALS keys in ClientScreen for explainable ranking demo
    const demoClients: DemoClient[] = [
      {
        id: 'amina',
        name: 'Amina Yakubu',
        type: 'pregnant',
        age: 24,
        community: 'Kukuo',
        caregiver: 'Amina Yakubu',
        phone: '+233241234567',
        priority: 'urgent',
        metric: 'hb',
        severe: false,
        referred: false,
        flag: 'Haemoglobin falling — anaemia risk',
        flagDetail: 'Hb dropped from 11.2 to 9.6 g/dL across 3 visits',
        trendNote: 'Declining Hb — risk of moderate anaemia',
        trendArrow: 'down',
        trendColor: '#C81E1E',
        lifestage: 'pregnant',
        visits: [
          { date: '3rd Jun, 2026',  weight: 64.5, hb: 11.2, muac: 242, diet: ['grains','legumes','vita','veg'],        danger: [], synced: true,  owner: 'You' },
          { date: '28th Jun, 2026', weight: 66.1, hb: 10.4, muac: 238, diet: ['grains','legumes'],                     danger: [], synced: true,  owner: 'You' },
          { date: '18th Jul, 2026', weight: 68.3, hb: 9.6,  muac: 235, diet: ['grains'],                              danger: [], synced: false, owner: 'You' },
        ],
      },
      {
        id: 'rahim',
        name: 'Rahimatu Issah',
        type: 'child',
        age: '18 mo',
        community: 'Choggu',
        caregiver: 'Issah Fuseini',
        phone: '+233209876543',
        priority: 'high',
        metric: 'weight',
        severe: false,
        referred: false,
        flag: 'Slow weight gain — nutrition gap',
        flagDetail: 'No weight gain in 2 consecutive months. Diet restricted to 2 food groups.',
        trendNote: 'Flat weight trend — expected growth not achieved',
        trendArrow: 'flat',
        trendColor: '#B54000',
        visits: [
          { date: '20th May, 2026', weight: 9.8, hb: null, muac: 126, diet: ['grains','breast'],         danger: [], synced: true,  owner: 'You' },
          { date: '19th Jun, 2026', weight: 9.8, hb: null, muac: 122, diet: ['grains'],                  danger: [], synced: true,  owner: 'You' },
          { date: '17th Jul, 2026', weight: 9.9, hb: null, muac: 124, diet: ['grains','breast'],         danger: [], synced: false, owner: 'You' },
        ],
      },
      {
        id: 'latif',
        name: 'Abdul Latif Mahama',
        type: 'child',
        age: '11 mo',
        community: 'Katariga',
        caregiver: 'Fatimatu Mahama',
        phone: '+233552345678',
        priority: 'urgent',
        metric: 'muac',
        severe: true,
        referred: true,
        flag: 'Danger sign — referral needed',
        flagDetail: 'MUAC 108 mm — below severe-wasting threshold (115 mm)',
        trendNote: 'Danger-zone measurement — needs urgent clinical care',
        trendArrow: 'down',
        trendColor: '#C81E1E',
        visits: [
          { date: '1st Jul, 2026',  weight: 6.4, hb: null, muac: 115, diet: ['grains','breast'],              danger: [],                   synced: true,  owner: 'You' },
          { date: '22nd Jul, 2026', weight: 6.1, hb: null, muac: 108, diet: ['grains'],            danger: ['bilateral_oedema'], synced: false, owner: 'You' },
        ],
      },
      {
        id: 'zeinab',
        name: 'Zeinab Alhassan',
        type: 'pregnant',
        age: 27,
        community: 'Lamashegu',
        caregiver: 'Zeinab Alhassan',
        phone: '+233243456789',
        priority: 'stable',
        metric: 'hb',
        severe: false,
        referred: false,
        flag: 'Stable · Hb within normal range',
        flagDetail: 'Hb stable at 11.8–11.9 g/dL. Good diet diversity across 5 food groups.',
        trendNote: 'Hb holding steady — continue iron/folate supplementation',
        trendArrow: 'up',
        trendColor: '#057A55',
        lifestage: 'pregnant',
        visits: [
          { date: '10th Jun, 2026', weight: 71.2, hb: 11.8, muac: 256, diet: ['grains','legumes','dairy','flesh','vita','veg'], danger: [], synced: true,  owner: 'You' },
          { date: '8th Jul, 2026',  weight: 73.6, hb: 11.9, muac: 258, diet: ['grains','legumes','eggs','vita','veg'],          danger: [], synced: false, owner: 'You' },
        ],
      },
      {
        id: 'sadia',
        name: 'Sadia Mohammed',
        type: 'child',
        age: '36 mo',
        community: 'Voggu',
        caregiver: 'Mohammed Alhassan',
        phone: '+233204567890',
        priority: 'stable',
        metric: 'weight',
        severe: false,
        referred: false,
        flag: 'Good progress · diet improving',
        flagDetail: 'Weight gaining consistently. Diet improved from 3 to 5 food groups.',
        trendNote: 'Positive weight trajectory',
        trendArrow: 'up',
        trendColor: '#057A55',
        visits: [
          { date: '5th May, 2026',  weight: 10.2, hb: null, muac: 148, diet: ['grains','legumes','vita'],               danger: [], synced: true,  owner: 'You' },
          { date: '2nd Jun, 2026',  weight: 10.6, hb: null, muac: 151, diet: ['grains','legumes','vita','veg'],          danger: [], synced: true,  owner: 'You' },
          { date: '30th Jun, 2026', weight: 10.9, hb: null, muac: 153, diet: ['grains','legumes','flesh','vita','veg'], danger: [], synced: false, owner: 'You' },
        ],
      },
    ];

    const demoReferrals: DemoReferral[] = [
      {
        id: 'ref-latif-001',
        clientId: 'latif',
        name: 'Abdul Latif Mahama',
        type: 'child',
        reason: 'MUAC 108 mm — below severe-wasting threshold (115 mm). Bilateral oedema present.',
        facility: 'Tamale West Hospital',
        phone: '+233552345678',
        status: 'issued',
        at: '22nd Jul, 2026',
        due: '25th Jul, 2026',
      },
    ];

    const demoNotifications: AppNotification[] = [
      {
        id: 'notif-latif',
        kind: 'risk',
        title: 'Urgent: Abdul Latif Mahama',
        body: 'MUAC 108 mm recorded — referral issued to Tamale West Hospital.',
        time: '22nd Jul, 14:22',
        read: false,
        group: 'today',
        target: 'latif',
      },
      {
        id: 'notif-amina',
        kind: 'risk',
        title: 'Amina Yakubu — Hb declining',
        body: 'Hb dropped to 9.6 g/dL. Follow-up recommended within 7 days.',
        time: '18th Jul, 10:05',
        read: false,
        group: 'today',
        target: 'amina',
      },
      {
        id: 'notif-bundle',
        kind: 'bundle',
        title: 'Reference bundle updated',
        body: 'Seasonal food data v2.1 downloaded. Rainy-season foods now available.',
        time: '15th Jul, 08:30',
        read: true,
        group: 'earlier',
        target: '',
      },
    ];

    // Pre-seeded plans so PlanScreen shows real data immediately (no visit needed first)
    const demoPlans: Record<string, PlanData> = {
      // Amina — pregnant, declining Hb → iron + folate + energy gap
      amina: {
        seasonNote: 'In season · July · Northern Savannah',
        targetNote: "Amina's plan targets iron, folate, and energy using locally available, affordable foods.",
        foods: [
          { name: 'Dawadawa (fermented locust bean)', local: 'Dawadawa', group: 'legumes', tier: 'Low cost', why: 'Highest iron source in the Northern Savannah (9 mg/100g). Adds flavour to soups.' },
          { name: 'Moringa leaves (fresh)',            local: 'Zogale',   group: 'vita',    tier: 'Low cost', why: 'Rich in iron, folate, and Vitamin A. Grows wild and in kitchen gardens.' },
          { name: 'Cowpea (beans)',                    local: 'Tuya',     group: 'legumes', tier: 'Low cost', why: 'Iron and folate. Abundant this season. Storable and affordable.' },
          { name: 'Dried small fish (tilapia)',        local: 'Amani',    group: 'flesh',   tier: 'Low cost', why: 'Iron and protein. Dried fish is available year-round and affordable.' },
          { name: 'Millet',                            local: 'Nyɔri',    group: 'grains',  tier: 'Low cost', why: 'Energy base for meals. Iron and folate from a local staple grain.' },
        ],
        alternates: [
          { name: 'Bambara beans', local: 'Suya', group: 'legumes', tier: 'Low cost', why: 'Protein and iron when cowpea is unavailable.' },
          { name: 'Egg',           local: 'Poli', group: 'eggs',    tier: 'Market',   why: 'Protein and Vitamin A when affordable.' },
        ],
        adequacy: [
          { label: 'Iron',    pct: 88 },
          { label: 'Folate',  pct: 82 },
          { label: 'Energy',  pct: 91 },
          { label: 'Protein', pct: 79 },
          { label: 'Vit A',   pct: 94 },
        ],
        rationale: [
          'Dawadawa: highest iron in the Northern Savannah. Closes iron gap.',
          'Moringa + cowpea: folate from two complementary local sources.',
          'All 5 foods are low-cost staples available this month.',
        ],
        voiceEn: "Amina's feeding plan: Add dawadawa and dried fish to every soup for iron. Eat moringa leaves with TZ at least 3 times a week. Cook cowpea and millet together for an energy-rich meal. These foods will help your blood stay strong for you and your baby.",
        voiceDag: "Amina din tuma nɔŋ: Di dawadawa ni amani soup biɛlim naa. Di zogale tuya nɔŋ daa nyɔri biɛlim naa. Di nyɔri ni tuya di biɛlim pam. N di nɔ n tuma din zuɣu.",
      },
      // Rahimatu — child 18mo, flat weight → energy + protein + diet diversity gap
      rahim: {
        seasonNote: 'In season · July · Northern Savannah',
        targetNote: "Rahimatu's plan targets energy, protein, and diet diversity to support catch-up growth.",
        foods: [
          { name: 'Sorghum (TZ / tuo zaafi)',   local: 'Saa',    group: 'grains',  tier: 'Low cost', why: 'Energy-dense base for daily meals. Familiar staple for complementary feeding.' },
          { name: 'Groundnut (peanut)',          local: 'Sisim',  group: 'legumes', tier: 'Low cost', why: 'High energy and protein. Abundant this season. Can be made into soup or paste.' },
          { name: 'Moringa leaves (fresh)',      local: 'Zogale', group: 'vita',    tier: 'Low cost', why: 'Vitamins A and C, iron. Adds micronutrients to any meal.' },
          { name: 'Egg',                         local: 'Poli',   group: 'eggs',    tier: 'Market',   why: 'Complete protein and Vitamin A for growth. One egg per day if affordable.' },
        ],
        alternates: [
          { name: 'Cowpea (beans)',   local: 'Tuya',  group: 'legumes', tier: 'Low cost', why: 'Protein when groundnut unavailable.' },
          { name: 'Dried small fish', local: 'Amani', group: 'flesh',   tier: 'Low cost', why: 'Iron and protein; storable.' },
        ],
        adequacy: [
          { label: 'Energy',  pct: 86 },
          { label: 'Protein', pct: 91 },
          { label: 'Iron',    pct: 72 },
          { label: 'Vit A',   pct: 88 },
          { label: 'Zinc',    pct: 78 },
        ],
        rationale: [
          'Flat weight for 2 months: energy and protein are priority nutrients.',
          'Groundnut provides high energy density for complementary feeding.',
          'Moringa closes the Vitamin A and iron gap with a free kitchen garden food.',
        ],
        voiceEn: "Rahimatu's feeding plan: Mix groundnut paste into sorghum TZ every day for energy. Add one egg three times a week for growth. Put moringa leaves in the soup for vitamins. Continue breastfeeding alongside these foods.",
        voiceDag: "Rahimatu din tuma nɔŋ: Di sisim saa nɔŋ daa. Di gala biɛlim naa zuɣ protein. Di zogale soup din zuɣu vitamins. Suɣiri yuli n ti.",
      },
    };

    set({
      isLoggedIn: true,
      role: 'cho',
      currentUser: demoUser,
      sessionExpired: false,
      clients: demoClients,
      referrals: demoReferrals,
      notifications: demoNotifications,
      plans: demoPlans,
      offline: true,
      syncing: false,
      lastSyncAt: null,
      pendingRecords: 3, // 3 unsynced visits across the caseload
      dataLoading: false,
    });
  },
}));

// ─── Selector helpers ─────────────────────────────────────────────────────────

export function initials(name: string): string {
  return name
    .replace('Baby ', '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function avatarStyle(type: ClientType): { bg: string; fg: string } {
  return type === 'pregnant'
    ? { bg: '#EFF7FE', fg: '#427CAF' }
    : { bg: '#FFEFE6', fg: '#B54000' };
}

export function priorityStyle(p: Priority): { color: string; bg: string; label: string } {
  if (p === 'urgent') return { color: '#C81E1E', bg: '#FDE8E8', label: 'Urgent' };
  if (p === 'high')   return { color: '#B54000', bg: '#FFEFE6', label: 'Follow up' };
  if (p === 'new')    return { color: '#427CAF', bg: '#EFF7FE', label: 'New' };
  return { color: '#057A55', bg: '#F3FAF7', label: 'Stable' };
}

export function formatMetric(metric: 'hb' | 'weight' | 'muac', value: number | null): string {
  if (value === null) return '—';
  if (metric === 'muac') return `${Math.round(value)} mm`;
  if (metric === 'hb')   return `${value.toFixed(1)} g/dL`;
  return `${value.toFixed(1)} kg`;
}

export function metricLabel(metric: 'hb' | 'weight' | 'muac'): string {
  if (metric === 'hb')   return 'Haemoglobin (g/dL)';
  if (metric === 'muac') return 'MUAC (mm)';
  return 'Weight (kg)';
}

/**
 * Derives a human-readable NurtureLink client ID from list position.
 * Format: NL-{COM}-{YEAR}-{SEQ}  e.g. NL-KUK-2026-00003
 * Note: position-based, not stable if clients are reordered.
 */
export function clientHumanId(client: DemoClient, allClients: DemoClient[]): string {
  const prefix = client.community
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  const idx = allClients.findIndex((c) => c.id === client.id);
  const seq = String(Math.max(idx, 0) + 1).padStart(5, '0');
  return `NL-${prefix}-${new Date().getFullYear()}-${seq}`;
}

/** Derives a household display ID from community prefix and index. */
export function householdHumanId(community: string, idx: number): string {
  const prefix = community
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  return `HH-${prefix}-${String(idx + 1).padStart(4, '0')}`;
}
