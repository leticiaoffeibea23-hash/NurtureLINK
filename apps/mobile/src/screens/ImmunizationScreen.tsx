import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore, VaccineRecord } from '../store';
import {
  ChevronLeft, Check, AlertTriangle, ShieldCheck, CalendarDays, ChevronDown,
} from 'lucide-react-native';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Immunization'>;

// ─── Ghana EPI Schedule ───────────────────────────────────────────────────────

const EPI_GROUPS: Array<{ heading: string; vaccines: Array<{ id: string; label: string }> }> = [
  {
    heading: 'AT BIRTH',
    vaccines: [
      { id: 'bcg',  label: 'BCG (tuberculosis)' },
      { id: 'opv0', label: 'OPV 0 (polio birth dose)' },
    ],
  },
  {
    heading: '6 WEEKS',
    vaccines: [
      { id: 'opv1',   label: 'OPV 1' },
      { id: 'penta1', label: 'Penta 1 (DPT + HepB + Hib)' },
      { id: 'pcv1',   label: 'PCV 1 (pneumococcal)' },
      { id: 'rota1',  label: 'Rota 1 (rotavirus)' },
    ],
  },
  {
    heading: '10 WEEKS',
    vaccines: [
      { id: 'opv2',   label: 'OPV 2' },
      { id: 'penta2', label: 'Penta 2' },
      { id: 'pcv2',   label: 'PCV 2' },
      { id: 'rota2',  label: 'Rota 2' },
    ],
  },
  {
    heading: '14 WEEKS',
    vaccines: [
      { id: 'opv3',   label: 'OPV 3' },
      { id: 'penta3', label: 'Penta 3' },
      { id: 'pcv3',   label: 'PCV 3' },
    ],
  },
  {
    heading: '9 MONTHS',
    vaccines: [
      { id: 'mr1',  label: 'MR 1 (Measles-Rubella)' },
      { id: 'yf',   label: 'Yellow Fever' },
      { id: 'mena', label: 'MenA (Meningococcal A)' },
    ],
  },
  {
    heading: '18 MONTHS',
    vaccines: [
      { id: 'mr2', label: 'MR 2 (Measles-Rubella booster)' },
    ],
  },
];

const TOTAL_VACCINES = EPI_GROUPS.reduce((n, g) => n + g.vaccines.length, 0);
const AEFI_SEVERITIES = ['mild', 'moderate', 'severe'] as const;

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:       '#08283B',
  bg:            '#F2F4F5',
  surface:       '#FDFDFD',
  border:        '#E5E7EB',
  fg1:           '#08283B',
  fg2:           '#374151',
  fg3:           '#6B7280',
  fg4:           '#9CA3AF',
  success:       '#057A55',
  successBg:     '#F3FAF7',
  successBorder: '#BCF0DA',
  warning:       '#B48700',
  warningBg:     '#FFF9E6',
  warningBorder: '#FFE18A',
  error:         '#C81E1E',
  errorBg:       '#FDF2F2',
  errorBorder:   '#FBD5D5',
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ─── VaccineRow ───────────────────────────────────────────────────────────────

function VaccineRow({
  vaccine,
  record,
  onSave,
}: {
  vaccine: { id: string; label: string };
  record?: VaccineRecord;
  onSave: (r: VaccineRecord) => void;
}) {
  const given = !!record;
  const [expanded, setExpanded] = useState(false);
  const [date, setDate]         = useState(record?.givenAt ?? '');
  const [batch, setBatch]       = useState(record?.batchNumber ?? '');
  const [aefi, setAefi]         = useState(record?.aefi ?? '');
  const [aefiSev, setAefiSev]   = useState<'' | 'mild' | 'moderate' | 'severe'>(
    (record?.aefiSeverity as '' | 'mild' | 'moderate' | 'severe') ?? '',
  );
  const [showPicker, setShowPicker] = useState(false);
  const dateObj = date ? new Date(date) : new Date();

  function handleSave() {
    if (!date) return;
    onSave({
      id: record?.id ?? `${vaccine.id}-${Date.now()}`,
      vaccineId: vaccine.id,
      givenAt: date,
      batchNumber: batch || undefined,
      aefi: aefi || undefined,
      aefiSeverity: aefiSev || undefined,
    });
    setExpanded(false);
  }

  return (
    <View style={vr.container}>
      <TouchableOpacity
        style={vr.row}
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={vaccine.label}
      >
        <View style={[vr.dot, { backgroundColor: given ? C.success : '#D1D5DB' }]} />
        <View style={{ flex: 1 }}>
          <Text style={[vr.label, given && { color: C.fg1, fontWeight: '600' }]}>
            {vaccine.label}
          </Text>
          {given && (
            <Text style={vr.givenDate}>Given {formatDate(record!.givenAt)}</Text>
          )}
          {given && record?.aefi && (
            <View style={vr.aefiBadge}>
              <AlertTriangle size={10} color={C.warning} />
              <Text style={vr.aefiLabel}>AEFI recorded</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {given && <Check size={16} color={C.success} strokeWidth={2.5} />}
          <ChevronDown size={16} color={C.fg4} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={vr.form}>
          {/* Date */}
          <Text style={vr.formLabel}>Date given</Text>
          {Platform.OS !== 'ios' && (
            <TouchableOpacity style={vr.dateBtn} onPress={() => setShowPicker(true)}>
              <CalendarDays size={16} color={date ? C.fg1 : C.fg4} />
              <Text style={[vr.dateBtnText, !date && { color: C.fg4 }]}>
                {date ? formatDate(date) : 'Select date'}
              </Text>
            </TouchableOpacity>
          )}
          {Platform.OS === 'ios' && (
            <>
              <TouchableOpacity style={vr.dateBtn} onPress={() => setShowPicker((v) => !v)}>
                <CalendarDays size={16} color={date ? C.fg1 : C.fg4} />
                <Text style={[vr.dateBtnText, !date && { color: C.fg4 }]}>
                  {date ? formatDate(date) : 'Select date'}
                </Text>
              </TouchableOpacity>
              {showPicker && (
                <DateTimePicker
                  value={dateObj}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onValueChange={(_, d) => { if (d) setDate(d.toISOString().slice(0, 10)); }}
                />
              )}
            </>
          )}
          {Platform.OS === 'android' && showPicker && (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onValueChange={(_, d) => { setShowPicker(false); if (d) setDate(d.toISOString().slice(0, 10)); }}
              onDismiss={() => setShowPicker(false)}
            />
          )}
          {Platform.OS === 'web' && (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onValueChange={(_, d) => { if (d) setDate(d.toISOString().slice(0, 10)); }}
            />
          )}

          {/* Batch number */}
          <Text style={[vr.formLabel, { marginTop: 12 }]}>Batch / lot number (optional)</Text>
          <TextInput
            style={vr.textInput}
            placeholder="e.g. GH-BCG-2025-001"
            placeholderTextColor={C.fg4}
            value={batch}
            onChangeText={setBatch}
            autoCapitalize="characters"
          />

          {/* AEFI */}
          <Text style={[vr.formLabel, { marginTop: 12 }]}>Adverse event (AEFI) — optional</Text>
          <TextInput
            style={[vr.textInput, { height: 68, textAlignVertical: 'top', paddingTop: 10 }]}
            placeholder="Describe any reaction observed…"
            placeholderTextColor={C.fg4}
            value={aefi}
            onChangeText={setAefi}
            multiline
            autoCapitalize="sentences"
          />
          {aefi.length > 0 && (
            <View style={vr.chipRow}>
              {AEFI_SEVERITIES.map((s) => {
                const active = aefiSev === s;
                return (
                  <Pressable
                    key={s}
                    style={[
                      vr.sevChip,
                      active && (
                        s === 'mild'     ? vr.sevMild
                        : s === 'moderate' ? vr.sevMod
                        : vr.sevSev
                      ),
                    ]}
                    onPress={() => setAefiSev(active ? '' : s)}
                  >
                    <Text style={[
                      vr.sevText,
                      active && { color: s === 'mild' ? C.success : s === 'moderate' ? C.warning : C.error, fontWeight: '700' },
                    ]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={[vr.saveBtn, !date && vr.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!date}
          >
            <Check size={16} color="#fff" strokeWidth={2.5} />
            <Text style={vr.saveBtnText}>{given ? 'Update record' : 'Record vaccine'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const vr = StyleSheet.create({
  container: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  label: { fontSize: 14, fontFamily: fonts.regular, color: C.fg2, fontWeight: '400' },
  givenDate: { fontSize: 12, fontFamily: fonts.regular, color: C.success, marginTop: 2 },
  aefiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  aefiLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: C.warning, fontWeight: '600' },
  form: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    padding: 14,
    backgroundColor: '#FAFAFA',
  },
  formLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: C.fg3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  dateBtnText: { fontSize: 14, fontFamily: fonts.regular, color: C.fg1, flex: 1 },
  textInput: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: C.fg1,
    height: 44,
  },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  sevChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  sevMild: { backgroundColor: C.successBg, borderColor: C.successBorder },
  sevMod:  { backgroundColor: C.warningBg, borderColor: C.warningBorder },
  sevSev:  { backgroundColor: C.errorBg,   borderColor: C.errorBorder },
  sevText: { fontSize: 13, fontFamily: fonts.medium, color: C.fg2, fontWeight: '500' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  saveBtnDisabled: { backgroundColor: '#B2BCC2' },
  saveBtnText: { fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: '#fff' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ImmunizationScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const { clients, immunizations, saveVaccineRecord } = useAppStore();
  const client  = clients.find((c) => c.id === clientId);
  const records = immunizations[clientId] ?? [];

  if (!client) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontFamily: fonts.regular, color: C.fg3 }}>Client not found.</Text>
      </View>
    );
  }

  const givenCount = records.length;
  const pct        = Math.round((givenCount / TOTAL_VACCINES) * 100);
  const pctColor   = pct >= 80 ? C.success : pct >= 50 ? C.warning : C.error;
  const aefis      = records.filter((r) => r.aefi);

  const allVaccines = EPI_GROUPS.flatMap((g) => g.vaccines);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.primary }}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Go back">
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>Immunization record</Text>
        <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.iconBox}>
            <ShieldCheck size={22} color="#B4DAFB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientSub}>
              {givenCount}/{TOTAL_VACCINES} vaccines · {pct}% complete
            </Text>
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        {/* Progress card */}
        <View style={styles.progressCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1 }}>Ghana EPI schedule</Text>
            <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: pctColor }}>{pct}% complete</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: pctColor }]} />
          </View>
          <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: C.fg3, marginTop: 6 }}>
            {givenCount} of {TOTAL_VACCINES} doses recorded · tap any row to record
          </Text>
        </View>

        {/* Vaccine groups */}
        {EPI_GROUPS.map((group) => (
          <View key={group.heading} style={{ marginBottom: 16 }}>
            <Text style={styles.groupHeading}>{group.heading}</Text>
            {group.vaccines.map((v) => (
              <VaccineRow
                key={v.id}
                vaccine={v}
                record={records.find((r) => r.vaccineId === v.id)}
                onSave={(rec) => saveVaccineRecord(clientId, rec)}
              />
            ))}
          </View>
        ))}

        {/* AEFI summary */}
        {aefis.length > 0 && (
          <View style={styles.aefiCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <AlertTriangle size={14} color={C.warning} />
              <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1 }}>
                Adverse events recorded (AEFI)
              </Text>
            </View>
            {aefis.map((r) => {
              const vax = allVaccines.find((v) => v.id === r.vaccineId);
              return (
                <View key={r.vaccineId} style={styles.aefiRow}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.semiBold, fontWeight: '600', color: C.fg1, marginBottom: 3 }}>
                    {vax?.label ?? r.vaccineId}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: C.fg2 }}>{r.aefi}</Text>
                  {r.aefiSeverity && (
                    <View style={[
                      styles.sevPill,
                      r.aefiSeverity === 'mild'     ? styles.sevMild
                      : r.aefiSeverity === 'moderate' ? styles.sevMod
                      : styles.sevSev,
                    ]}>
                      <Text style={[
                        styles.sevPillText,
                        {
                          color: r.aefiSeverity === 'mild' ? C.success
                            : r.aefiSeverity === 'moderate' ? C.warning : C.error,
                        },
                      ]}>
                        {r.aefiSeverity.charAt(0).toUpperCase() + r.aefiSeverity.slice(1)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerLabel: { fontSize: 13, fontFamily: fonts.regular, color: '#8D9CA5', marginTop: 2 },
  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(180,218,251,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  clientName: { fontSize: 18, fontFamily: fonts.bold, fontWeight: '700', color: '#fff' },
  clientSub:  { fontSize: 12, fontFamily: fonts.regular, color: '#92C9F9', marginTop: 2 },

  scroll:  { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: -8 },
  content: { padding: 16, paddingBottom: 40 },

  progressCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  progressTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3 },

  groupHeading: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: C.fg4,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
    marginTop: 4,
  },

  aefiCard: {
    backgroundColor: C.warningBg,
    borderWidth: 1,
    borderColor: C.warningBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  aefiRow: {
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 8,
  },
  sevPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  sevMild: { backgroundColor: C.successBg },
  sevMod:  { backgroundColor: C.warningBg },
  sevSev:  { backgroundColor: C.errorBg },
  sevPillText: { fontSize: 11, fontFamily: fonts.bold, fontWeight: '700' },
});
