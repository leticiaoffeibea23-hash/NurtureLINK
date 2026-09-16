import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore, VisitForm } from '../store';
import { ChevronLeft, Check, AlertTriangle, Droplets, Baby, Info } from 'lucide-react-native';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Visit'>;

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:         '#08283B',
  bg:              '#F2F4F5',
  surface:         '#FDFDFD',
  border:          '#E5E7EB',
  fg1:             '#08283B',
  fg2:             '#374151',
  fg3:             '#6B7280',
  fg4:             '#9CA3AF',
  lb50:            '#EFF7FE',
  lb200:           '#B4DAFB',
  brand:           '#FF5A00',
  success:         '#057A55',
  successBg:       '#F3FAF7',
  successBorder:   '#BCF0DA',
  warning:         '#B48700',
  warningBg:       '#FFF9E6',
  warningBorder:   '#FFE18A',
  error:           '#C81E1E',
  errorBg:         '#FDF2F2',
  errorBorder:     '#FBD5D5',
  errorDark:       '#9B1C1C',
  infoBg:          '#EFF7FE',
  infoBorder:      '#B4DAFB',
  infoText:        '#1A568C',
};

// ─── Food group config ────────────────────────────────────────────────────────
const FOOD_GROUPS = [
  { id: 'grains',  label: 'Grains & roots',    color: '#B48700' },
  { id: 'legumes', label: 'Legumes & nuts',     color: '#B54000' },
  { id: 'dairy',   label: 'Dairy',              color: '#427CAF' },
  { id: 'flesh',   label: 'Meat & fish',        color: '#036672' },
  { id: 'eggs',    label: 'Eggs',               color: '#BF125D' },
  { id: 'vita',    label: 'Vit-A veg & fruit',  color: '#057A55' },
  { id: 'veg',     label: 'Other veg & fruit',  color: '#6C2BD9' },
  { id: 'breast',  label: 'Breastmilk',         color: '#559FE0' },
];

const DANGER_SIGNS = [
  { id: 'bilateral_oedema',       label: 'Swelling of both feet (bilateral oedema)' },
  { id: 'convulsions',            label: 'Convulsions or unusually sleepy' },
  { id: 'heavy_vaginal_bleeding', label: 'Heavy vaginal bleeding' },
  { id: 'severe_headache_visual', label: 'Severe headache or vision problems' },
  { id: 'severe_abdominal_pain',  label: 'Severe abdominal pain' },
  { id: 'difficulty_breathing',   label: 'Difficulty breathing at rest' },
  { id: 'baby_not_moving',        label: 'Baby not moving (3rd trimester)' },
  { id: 'pallor_severe',          label: 'Severe pallor (whitening of palms/eyelids)' },
];

const FEEDING_TEXTURES = [
  { id: 'smooth', label: 'Smooth puree' },
  { id: 'mashed', label: 'Mashed' },
  { id: 'lumpy',  label: 'Lumpy / finger foods' },
  { id: 'family', label: 'Family foods' },
];

// ─── Age parsing ──────────────────────────────────────────────────────────────

/** Returns age in months for a child, or null if unknown. */
function parseChildAgeMonths(age: string | number): number | null {
  if (typeof age === 'number') return age * 12;
  if (typeof age === 'string') {
    const mo = age.match(/^(\d+)\s*mo?/i);
    if (mo) return parseInt(mo[1], 10);
    const yr = age.match(/^(\d+)/);
    if (yr) return parseInt(yr[1], 10) * 12;
  }
  return null;
}

function vitaminADose(ageMonths: number | null): string | null {
  if (ageMonths === null || ageMonths < 6) return null;
  if (ageMonths < 12) return '100,000 IU (blue capsule)';
  return '200,000 IU (red capsule)';
}

// ─── Range validation (G4) ───────────────────────────────────────────────────

interface RangeIssue { field: string; value: string; reason: string }

function checkRanges(form: VisitForm): RangeIssue[] {
  const issues: RangeIssue[] = [];
  const muac   = parseFloat(form.muac);
  const weight = parseFloat(form.weight);
  const hb     = parseFloat(form.hb);
  const bpSys  = parseFloat(form.bpSystolic);
  const bpDia  = parseFloat(form.bpDiastolic);
  const height = parseFloat(form.heightCm);

  if (form.muac      && !isNaN(muac)   && (muac   < 50   || muac   > 250)) issues.push({ field: 'MUAC',             value: `${muac} mm`,    reason: 'expected 50–250 mm'   });
  if (form.weight    && !isNaN(weight) && (weight  < 0.5  || weight  > 150)) issues.push({ field: 'Weight',           value: `${weight} kg`,  reason: 'expected 0.5–150 kg'  });
  if (form.hb        && !isNaN(hb)     && (hb      < 3    || hb      > 20))  issues.push({ field: 'Haemoglobin',      value: `${hb} g/dL`,    reason: 'expected 3–20 g/dL'   });
  if (form.bpSystolic && !isNaN(bpSys) && (bpSys   < 60   || bpSys   > 220)) issues.push({ field: 'BP systolic',      value: `${bpSys} mmHg`, reason: 'expected 60–220 mmHg' });
  if (form.bpDiastolic&& !isNaN(bpDia) && (bpDia   < 30   || bpDia   > 130)) issues.push({ field: 'BP diastolic',     value: `${bpDia} mmHg`, reason: 'expected 30–130 mmHg' });
  if (form.heightCm  && !isNaN(height) && (height  < 30   || height  > 130)) issues.push({ field: 'Height',           value: `${height} cm`,  reason: 'expected 30–130 cm'   });
  return issues;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Eyebrow({ label }: { label: string }) {
  return <Text style={styles.eyebrow}>{label}</Text>;
}

function MeasureCard({
  label, value, unit, placeholder, onChangeText,
}: {
  label: string; value: string; unit: string; placeholder: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={[styles.measureCard, { flex: 1 }]}>
      <Text style={styles.measureLabel}>{label}</Text>
      <TextInput
        style={styles.measureInput}
        inputMode="decimal"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.fg4}
        accessibilityLabel={`${label} in ${unit}`}
      />
      <Text style={styles.measureUnit}>{unit}</Text>
    </View>
  );
}

function YesNoRow({
  label, value, onToggle,
}: {
  label: string; value: string; onToggle: (v: string) => void;
}) {
  return (
    <View style={styles.yesNoRow}>
      <Text style={styles.yesNoLabel}>{label}</Text>
      <View style={styles.yesNoBtns}>
        {(['yes', 'no'] as const).map((opt) => {
          const active = value === opt;
          const isYes = opt === 'yes';
          return (
            <Pressable
              key={opt}
              style={[
                styles.yesNoBtn,
                active && (isYes ? styles.yesBtnActive : styles.noBtnActive),
              ]}
              onPress={() => onToggle(active ? '' : opt)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <Text style={[styles.yesNoBtnText, active && styles.yesNoBtnTextActive]}>
                {isYes ? 'Yes' : 'No'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function VisitScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const store = useAppStore();
  const client = store.clients.find((c) => c.id === clientId);
  const form   = store.visitForm;

  if (!client) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: C.fg3 }}>Client not found.</Text>
      </View>
    );
  }

  const isPregnant = client.type === 'pregnant';
  const isChild    = client.type === 'child';
  const ageMonths  = isChild ? parseChildAgeMonths(client.age) : null;

  // Age group flags
  const isNewborn         = isChild && ageMonths !== null && ageMonths < 1;
  const isInfant          = isChild && (ageMonths === null || ageMonths < 6);
  const isYoungChild      = isChild && ageMonths !== null && ageMonths >= 6 && ageMonths < 24;
  const isOlderChild      = isChild && ageMonths !== null && ageMonths >= 24;
  const isVitAEligible    = isChild && ageMonths !== null && ageMonths >= 6;
  const vitADose          = vitaminADose(ageMonths);

  const dietScore = form.diet.length;
  const hasDanger = form.danger.length > 0;

  function scoreColor(n: number) {
    if (n >= 5) return C.success;
    if (n >= 3) return C.warning;
    return C.error;
  }
  function scoreBg(n: number) {
    if (n >= 5) return C.successBg;
    if (n >= 3) return C.warningBg;
    return C.errorBg;
  }

  function setField(k: keyof VisitForm, v: string) {
    store.setVisitField(k, v);
  }

  function doSave() {
    const result = store.saveVisit(clientId);
    store.resetVisitForm();
    if (result === 'referral') {
      navigation.navigate('ReferralGuardrail', { clientId });
    } else {
      navigation.navigate('Plan', { clientId });
    }
  }

  function handleSave() {
    const issues = checkRanges(form);
    if (issues.length > 0) {
      const msg = issues.map((i) => `• ${i.field}: ${i.value} (${i.reason})`).join('\n');
      Alert.alert(
        'Unusual values — please recheck',
        `The following values look unusual:\n\n${msg}\n\nSave anyway?`,
        [
          { text: 'Go back', style: 'cancel' },
          { text: 'Save anyway', onPress: doSave },
        ],
      );
    } else {
      doSave();
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.primary }}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Client', { clientId })}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ marginTop: 4 }}>
          <Text style={styles.headerTitle}>New visit</Text>
          <Text style={styles.headerSub}>
            {client.name} · {client.type === 'pregnant' ? 'pregnant' : ageMonths !== null ? `${ageMonths < 24 ? `${ageMonths} mo` : `${Math.floor(ageMonths / 12)} yr`}` : 'child'} · today
          </Text>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── MEASUREMENTS (always) ── */}
        <Eyebrow label="MEASUREMENTS" />

        {/* Weight + Hb */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <MeasureCard
            label="Weight"
            value={form.weight}
            unit="kg"
            placeholder="e.g. 8.4"
            onChangeText={(v) => setField('weight', v)}
          />
          <MeasureCard
            label="Haemoglobin"
            value={form.hb}
            unit="g/dL"
            placeholder="e.g. 11.2"
            onChangeText={(v) => setField('hb', v)}
          />
        </View>

        {/* MUAC */}
        <View style={[styles.measureCard, { marginBottom: 10 }]}>
          <Text style={styles.measureLabel}>MUAC</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <TextInput
              style={[styles.measureInput, { flex: 1 }]}
              inputMode="decimal"
              value={form.muac}
              onChangeText={(v) => setField('muac', v)}
              placeholder="e.g. 135"
              placeholderTextColor={C.fg4}
              accessibilityLabel="MUAC in mm"
            />
            <Text style={styles.measureUnit}>mm</Text>
          </View>
        </View>

        {/* Height + Oedema — children only */}
        {isChild && (
          <>
            <View style={[styles.measureCard, { marginBottom: 10 }]}>
              <Text style={styles.measureLabel}>Height / length</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <TextInput
                  style={[styles.measureInput, { flex: 1 }]}
                  inputMode="decimal"
                  value={form.heightCm}
                  onChangeText={(v) => setField('heightCm', v)}
                  placeholder="e.g. 72"
                  placeholderTextColor={C.fg4}
                  accessibilityLabel="Height in cm"
                />
                <Text style={styles.measureUnit}>cm</Text>
              </View>
            </View>
            <View style={[styles.sectionCard, { marginBottom: 20 }]}>
              <YesNoRow
                label="Bilateral oedema (both feet swollen)?"
                value={form.oedema}
                onToggle={(v) => setField('oedema', v)}
              />
            </View>
          </>
        )}

        {/* ── NEWBORN ASSESSMENT — child < 1 month ── */}
        {isNewborn && (
          <>
            <Eyebrow label="NEWBORN ASSESSMENT (< 1 MONTH)" />
            <View style={[styles.sectionCard, { marginBottom: 20 }]}>
              <YesNoRow
                label="Umbilical cord normal (no redness, swelling, or discharge)?"
                value={form.cordCondition}
                onToggle={(v) => setField('cordCondition', v)}
              />
              <View style={styles.divider} />
              <YesNoRow
                label="Jaundice present (yellow skin or eyes)?"
                value={form.jaundice}
                onToggle={(v) => setField('jaundice', v)}
              />
              <View style={styles.divider} />
              <YesNoRow
                label="Breastfeeding initiated within 1 hour of birth?"
                value={form.breastfeedInitiated}
                onToggle={(v) => setField('breastfeedInitiated', v)}
              />
            </View>
          </>
        )}

        {/* ── BLOOD PRESSURE — pregnant only ── */}
        {isPregnant && (
          <>
            <Eyebrow label="BLOOD PRESSURE" />
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <View style={[styles.measureCard, { flex: 1 }]}>
                <Text style={styles.measureLabel}>Systolic</Text>
                <TextInput
                  style={styles.measureInput}
                  inputMode="decimal"
                  value={form.bpSystolic}
                  onChangeText={(v) => setField('bpSystolic', v)}
                  placeholder="e.g. 120"
                  placeholderTextColor={C.fg4}
                  accessibilityLabel="Systolic blood pressure"
                />
                <Text style={styles.measureUnit}>mmHg</Text>
              </View>
              <View style={[styles.measureCard, { flex: 1 }]}>
                <Text style={styles.measureLabel}>Diastolic</Text>
                <TextInput
                  style={styles.measureInput}
                  inputMode="decimal"
                  value={form.bpDiastolic}
                  onChangeText={(v) => setField('bpDiastolic', v)}
                  placeholder="e.g. 80"
                  placeholderTextColor={C.fg4}
                  accessibilityLabel="Diastolic blood pressure"
                />
                <Text style={styles.measureUnit}>mmHg</Text>
              </View>
            </View>
          </>
        )}

        {/* ── ANC & SUPPLEMENTS — pregnant only ── */}
        {isPregnant && (
          <>
            <Eyebrow label="ANC & SUPPLEMENTS" />
            <View style={[styles.sectionCard, { marginBottom: 20 }]}>
              <YesNoRow
                label="ANC visit attended since last contact?"
                value={form.ancVisited}
                onToggle={(v) => setField('ancVisited', v)}
              />
              <View style={styles.divider} />
              <YesNoRow
                label="Iron / folate supplement given?"
                value={form.supplementGiven}
                onToggle={(v) => setField('supplementGiven', v)}
              />
            </View>
          </>
        )}

        {/* ── INFANT FEEDING — child 0–5 mo ── */}
        {isInfant && (
          <>
            <Eyebrow label="INFANT FEEDING (0–5 MONTHS)" />
            <View style={[styles.sectionCard, { marginBottom: 20 }]}>
              <YesNoRow
                label="Exclusively breastfed (nothing except breastmilk)?"
                value={form.exclusiveBreastfeeding}
                onToggle={(v) => setField('exclusiveBreastfeeding', v)}
              />
              <View style={styles.divider} />
              <YesNoRow
                label="Any difficulty feeding observed?"
                value={form.feedingDifficulty}
                onToggle={(v) => setField('feedingDifficulty', v)}
              />
            </View>
          </>
        )}

        {/* ── COMPLEMENTARY FEEDING — child 6–23 mo ── */}
        {isYoungChild && (
          <>
            <Eyebrow label="COMPLEMENTARY FEEDING (6–23 MONTHS)" />
            <View style={[styles.sectionCard, { marginBottom: 20 }]}>
              {/* Meals per day */}
              <Text style={styles.sectionFieldLabel}>Meals per day (including snacks)</Text>
              <View style={[styles.measureCard, { marginBottom: 14, borderWidth: 0, padding: 0 }]}>
                <TextInput
                  style={[styles.measureInput, { fontSize: 18, fontFamily: fonts.bold }]}
                  inputMode="numeric"
                  value={form.mealFreqPerDay}
                  onChangeText={(v) => setField('mealFreqPerDay', v)}
                  placeholder="e.g. 3"
                  placeholderTextColor={C.fg4}
                  accessibilityLabel="Number of meals per day"
                />
              </View>

              {/* Food texture */}
              <Text style={styles.sectionFieldLabel}>Food texture at meals</Text>
              <View style={styles.chipRow}>
                {FEEDING_TEXTURES.map((t) => {
                  const sel = form.feedingTexture === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      style={[styles.textureChip, sel && styles.textureChipActive]}
                      onPress={() => setField('feedingTexture', sel ? '' : t.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: sel }}
                    >
                      <Text style={[styles.textureChipText, sel && styles.textureChipTextActive]}>
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.divider} />
              <YesNoRow
                label="Continues feeding during illness?"
                value={form.feedingDuringIllness}
                onToggle={(v) => setField('feedingDuringIllness', v)}
              />
            </View>
          </>
        )}

        {/* Older child family diet note (24–59 mo) */}
        {isOlderChild && (
          <>
            <Eyebrow label="FAMILY DIET (24–59 MONTHS)" />
            <View style={[styles.infoBanner, { marginBottom: 20 }]}>
              <Info size={14} color={C.infoText} style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.infoBannerText}>
                Use the dietary recall below to assess access to varied family foods.
              </Text>
            </View>
          </>
        )}

        {/* ── DIETARY RECALL (always) ── */}
        <Eyebrow label="DIETARY RECALL · PAST 24 H" />
        <Text style={styles.hint}>Tap every food group the client ate</Text>

        <View style={styles.gridWrap}>
          {FOOD_GROUPS.map((g) => {
            const sel = form.diet.includes(g.id);
            return (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.chip,
                  { backgroundColor: sel ? C.lb50 : C.surface, borderColor: sel ? C.lb200 : C.border, width: '48%' },
                ]}
                onPress={() => store.toggleDiet(g.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: sel }}
                accessibilityLabel={g.label}
              >
                <View style={[styles.chipBox, { backgroundColor: sel ? g.color : '#ECECEB' }]}>
                  {sel && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={{ fontSize: 13, fontFamily: sel ? fonts.semiBold : fonts.regular, color: sel ? C.fg1 : C.fg2, fontWeight: sel ? '600' : '400', flexShrink: 1 }}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.diversityRow, { backgroundColor: scoreBg(dietScore) }]}>
          <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: C.fg2 }}>Diet diversity score</Text>
          <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: scoreColor(dietScore) }}>{dietScore}/8</Text>
        </View>

        {/* ── VITAMIN A — child 6–59 mo ── */}
        {isVitAEligible && (
          <>
            <Eyebrow label="VITAMIN A SUPPLEMENTATION" />
            <View style={[styles.sectionCard, { marginBottom: 20 }]}>
              <YesNoRow
                label="Vitamin A given this visit?"
                value={form.vitaminAGiven}
                onToggle={(v) => setField('vitaminAGiven', v)}
              />
              {form.vitaminAGiven === 'yes' && vitADose && (
                <View style={[styles.infoBanner, { marginTop: 12 }]}>
                  <Droplets size={14} color={C.infoText} style={{ marginRight: 8, marginTop: 1 }} />
                  <Text style={styles.infoBannerText}>
                    Recommended dose for this age: <Text style={{ fontWeight: '700' }}>{vitADose}</Text>
                  </Text>
                </View>
              )}
              {form.vitaminAGiven === 'yes' && !vitADose && (
                <View style={[styles.infoBanner, { marginTop: 12, backgroundColor: C.warningBg, borderColor: C.warningBorder }]}>
                  <Baby size={14} color={C.warning} style={{ marginRight: 8, marginTop: 1 }} />
                  <Text style={[styles.infoBannerText, { color: C.warning }]}>
                    Under 6 months — Vitamin A supplementation not recommended at this age.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* ── DANGER SIGNS (always) ── */}
        <Eyebrow label="DANGER SIGNS" />
        <Text style={[styles.hint, { marginBottom: 12 }]}>
          Any of these bypasses counselling and routes to referral
        </Text>

        {DANGER_SIGNS.map((d) => {
          const sel = form.danger.includes(d.id);
          return (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.dangerRow,
                { backgroundColor: sel ? C.errorBg : '#fff', borderColor: sel ? C.errorBorder : C.border },
              ]}
              onPress={() => store.toggleDanger(d.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: sel }}
              accessibilityLabel={d.label}
            >
              <View style={[styles.dangerCheck, { backgroundColor: sel ? C.error : '#fff', borderColor: sel ? C.error : C.border }]}>
                {sel && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={{ flex: 1, fontSize: 13, fontFamily: fonts.regular, color: sel ? C.errorDark : C.fg2, lineHeight: 19 }}>
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {hasDanger && (
          <View style={styles.dangerBanner}>
            <AlertTriangle size={16} color={C.errorDark} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: C.errorDark, flex: 1, lineHeight: 18 }}>
              Saving will route to referral — counselling is bypassed
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Save button ── */}
      <View style={styles.saveBar}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: hasDanger ? C.error : C.primary }]}
          onPress={handleSave}
          accessibilityLabel={hasDanger ? 'Save and refer' : 'Save visit'}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.bold, fontWeight: '700' }}>
            {hasDanger ? 'Save & refer' : 'Save visit'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#92C9F9',
    marginTop: 2,
  },
  body: {
    flex: 1,
    backgroundColor: C.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -8,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: C.fg4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: C.fg4,
    marginBottom: 10,
  },
  measureCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    padding: 12,
  },
  measureLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: C.fg3,
    marginBottom: 4,
  },
  measureInput: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: C.fg1,
    padding: 0,
    minHeight: 32,
  },
  measureUnit: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: C.fg4,
    marginTop: 2,
  },

  sectionCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectionFieldLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: C.fg2,
    fontWeight: '500',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },

  yesNoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  yesNoLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: C.fg2,
    lineHeight: 19,
  },
  yesNoBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  yesNoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  yesBtnActive: {
    backgroundColor: C.successBg,
    borderColor: C.successBorder,
  },
  noBtnActive: {
    backgroundColor: C.errorBg,
    borderColor: C.errorBorder,
  },
  yesNoBtnText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: C.fg3,
  },
  yesNoBtnTextActive: {
    color: C.fg1,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  textureChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  textureChipActive: {
    backgroundColor: C.lb50,
    borderColor: C.lb200,
  },
  textureChipText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: C.fg3,
    fontWeight: '500',
  },
  textureChipTextActive: {
    color: C.fg1,
    fontWeight: '600',
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.infoBg,
    borderWidth: 1,
    borderColor: C.infoBorder,
    borderRadius: 10,
    padding: 11,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: C.infoText,
    lineHeight: 18,
  },

  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  chipBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diversityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },

  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  dangerCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: C.errorBorder,
    borderRadius: 12,
    padding: 13,
    marginTop: 6,
  },

  saveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
});
