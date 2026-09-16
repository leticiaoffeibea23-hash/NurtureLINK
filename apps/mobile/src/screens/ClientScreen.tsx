import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  useAppStore,
  DemoClient,
  DemoVisit,
  initials,
  avatarStyle,
  priorityStyle,
  formatMetric,
  metricLabel,
  clientHumanId,
} from '../store';
import {
  ChevronLeft, TrendingUp, TrendingDown, Minus, Check, AlertTriangle,
  BarChart2, ClipboardList, ShieldCheck, ChevronRight, Link,
} from 'lucide-react-native';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Client'>;

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:         '#08283B',
  accent:          '#FF5A00',
  bg:              '#F2F4F5',
  surface:         '#FDFDFD',
  border:          '#E5E7EB',
  borderStrong:    '#D1D5DB',
  fg1:             '#08283B',
  fg2:             '#374151',
  fg3:             '#6B7280',
  fg4:             '#9CA3AF',
  lb50:            '#EFF7FE',
  lb200:           '#B4DAFB',
  lb300:           '#92C9F9',
  lb700:           '#427CAF',
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
  highPriority:    '#B54000',
  highPriorityBg:  '#FFEFE6',
};

// ─── Food group config ────────────────────────────────────────────────────────
const FOOD_GROUPS = [
  { id: 'grains',  label: 'Grains',   color: '#B48700' },
  { id: 'legumes', label: 'Legumes',  color: '#B54000' },
  { id: 'dairy',   label: 'Dairy',    color: '#427CAF' },
  { id: 'flesh',   label: 'Meat',     color: '#036672' },
  { id: 'eggs',    label: 'Eggs',     color: '#BF125D' },
  { id: 'vita',    label: 'Vit-A',    color: '#057A55' },
  { id: 'veg',     label: 'Veg',      color: '#6C2BD9' },
  { id: 'breast',  label: 'Breast',   color: '#559FE0' },
];

// ─── Computed ranking signals from visit history ──────────────────────────────
function computeRankSignals(client: DemoClient): string[] {
  const { visits, metric, type, flagDetail } = client;
  if (visits.length === 0) return [flagDetail || 'No visits recorded yet'];

  const signals: string[] = [];
  const first = visits[0];
  const last = visits[visits.length - 1];

  // Metric trend
  if (metric === 'hb' && first.hb !== null && last.hb !== null) {
    const direction = last.hb < first.hb ? 'fell' : last.hb > first.hb ? 'rose' : 'stable';
    signals.push(`Hb ${direction} from ${first.hb} → ${last.hb} g/dL across ${visits.length} visit${visits.length !== 1 ? 's' : ''}`);
  } else if (metric === 'weight') {
    const diff = last.weight - first.weight;
    if (Math.abs(diff) < 0.15 && visits.length >= 2) {
      signals.push(`No weight gain in ${visits.length} consecutive visit${visits.length !== 1 ? 's' : ''}`);
    } else if (diff > 0) {
      signals.push(`Weight gaining: ${first.weight} → ${last.weight} kg`);
    } else {
      signals.push(`Weight falling: ${first.weight} → ${last.weight} kg`);
    }
  } else if (metric === 'muac') {
    const mFirst = first.muac;
    const mLast = last.muac;
    if (visits.length >= 2) {
      signals.push(`MUAC ${mFirst > mLast ? 'falling' : 'improving'}: ${mFirst} → ${mLast} mm across ${visits.length} visit${visits.length !== 1 ? 's' : ''}`);
    }
    // Severe threshold (child: < 115 mm)
    if (type === 'child' && mLast < 115) {
      signals.push(`MUAC ${mLast} mm — below severe-wasting threshold (115 mm)`);
    }
  }

  // Diet diversity at last visit
  const lastDiet = last.diet;
  if (lastDiet.length <= 2) {
    signals.push(`Diet restricted to only ${lastDiet.length} food group${lastDiet.length !== 1 ? 's' : ''} at last visit`);
  } else if (lastDiet.length >= 5) {
    signals.push(`Good diet diversity: ${lastDiet.length} food groups at last visit`);
  } else if (visits.length >= 2) {
    const firstDiet = first.diet.length;
    if (lastDiet.length > firstDiet) {
      signals.push(`Diet improved from ${firstDiet} to ${lastDiet.length} food groups`);
    }
  }

  // Danger signs at last visit
  if (last.danger.length > 0) {
    signals.push(`Danger sign${last.danger.length > 1 ? 's' : ''} present: ${last.danger.join(', ')}`);
  }

  // MUAC trend for children (even if not primary metric)
  if (metric !== 'muac' && type === 'child' && visits.length >= 2) {
    const muacDiff = last.muac - first.muac;
    if (muacDiff < -5) {
      signals.push(`MUAC declining: ${first.muac} → ${last.muac} mm`);
    }
  }

  return signals.length > 0 ? signals : [flagDetail || 'Assessed across multiple visits'];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMetricValues(visits: DemoVisit[], metric: 'hb' | 'weight' | 'muac'): (number | null)[] {
  return visits.map((v) => {
    if (metric === 'hb')     return v.hb;
    if (metric === 'weight') return v.weight;
    return v.muac;
  });
}

function dietScore(diet: string[]): number {
  return diet.length;
}

function dietScoreColor(score: number): string {
  if (score >= 5) return C.success;
  if (score >= 3) return C.warning;
  return C.error;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrendChart({
  visits,
  metric,
  trendColor,
}: {
  visits: DemoVisit[];
  metric: 'hb' | 'weight' | 'muac';
  trendColor: string;
}) {
  const values = getMetricValues(visits, metric);
  const nonNull = values.filter((v): v is number => v !== null);
  if (nonNull.length === 0) return null;

  const min = Math.min(...nonNull) * 0.92;
  const max = Math.max(...nonNull) * 1.08;
  const range = max - min || 1;
  const chartH = 80;

  return (
    <View style={{ height: chartH + 24, flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 4, position: 'relative' }}>
      {/* grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <View
          key={frac}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 24 + chartH * frac,
            height: 1,
            backgroundColor: '#ECECEB',
          }}
        />
      ))}
      {visits.map((v, i) => {
        const val = getMetricValues([v], metric)[0];
        const barH = val !== null ? Math.max(8, ((val - min) / range) * chartH) : 8;
        const isLast = i === visits.length - 1;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <View
              style={{
                width: '100%',
                height: barH,
                backgroundColor: trendColor,
                opacity: isLast ? 1 : 0.5,
                borderRadius: 4,
              }}
            />
            <Text style={{ fontSize: 9, fontFamily: fonts.regular, color: C.fg4, textAlign: 'center', marginTop: 4 }} numberOfLines={1}>
              {v.date.split(',')[0]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function DietDiversityCard({ lastVisit }: { lastVisit: DemoVisit }) {
  const score = dietScore(lastVisit.diet);
  const scoreColor = dietScoreColor(score);
  const met = score >= 5;

  return (
    <View style={[styles.card, { marginBottom: 12 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1 }}>Diet diversity · last visit</Text>
        <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: scoreColor }}>{score}/8 groups</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 10 }}>
        {FOOD_GROUPS.map((g) => {
          const eaten = lastVisit.diet.includes(g.id);
          return (
            <View
              key={g.id}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 8,
                backgroundColor: eaten ? g.color : '#ECECEB',
                borderWidth: 1,
                borderColor: eaten ? g.color : C.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          );
        })}
      </View>
      <Text style={{ fontSize: 12, fontFamily: fonts.semiBold, color: met ? C.success : C.warning, fontWeight: '600' }}>
        {met ? 'Minimum diet diversity \u2713 met' : 'Below minimum diet diversity'}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function ClientScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const { clients, referrals, confirmReferralSeen, role, immunizations } = useAppStore();
  const client = clients.find((c) => c.id === clientId);
  const referral = referrals.find((r) => r.clientId === clientId);

  if (!client) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: C.fg3 }}>Client not found.</Text>
      </View>
    );
  }

  const visits = client.visits;
  const lastVisit = visits[visits.length - 1] ?? null;
  const pStyle = priorityStyle(client.priority);
  const aStyle = avatarStyle(client.type);
  const abbrev = initials(client.name);
  const label = metricLabel(client.metric);

  const humanId      = clientHumanId(client, clients);
  const isSupervisor = role === 'sup';
  const isChild      = client.type === 'child';
  const linkedClient = client.linkedClientId
    ? clients.find((c) => c.id === client.linkedClientId) ?? null
    : null;
  const vaccinationCount = (immunizations[clientId] ?? []).length;
  const TOTAL_VACCINES   = 17; // Ghana EPI schedule total
  const currentValue = lastVisit
    ? formatMetric(client.metric, client.metric === 'hb' ? lastVisit.hb : client.metric === 'weight' ? lastVisit.weight : lastVisit.muac)
    : '—';

  // trend delta
  let trendDelta = '';
  if (visits.length >= 2) {
    const getVal = (v: DemoVisit) =>
      client.metric === 'hb' ? v.hb : client.metric === 'weight' ? v.weight : v.muac;
    const first = getVal(visits[0]);
    const last  = getVal(visits[visits.length - 1]);
    if (first !== null && last !== null) {
      const diff = last - first;
      const sign = diff >= 0 ? '+' : '';
      if (client.metric === 'hb')          trendDelta = `${sign}${diff.toFixed(1)} g/dL`;
      else if (client.metric === 'weight') trendDelta = `${sign}${diff.toFixed(1)} kg`;
      else                                 trendDelta = `${sign}${Math.round(diff)} mm`;
    }
  }

  const rankSignals = computeRankSignals(client);

  // priority flag styles
  let flagBg = C.successBg;
  let flagBorder = C.successBorder;
  let flagTextColor = C.success;
  let flagWarn = false;
  if (client.priority === 'urgent') {
    flagBg = C.errorBg; flagBorder = C.errorBorder; flagTextColor = C.error; flagWarn = true;
  } else if (client.priority === 'high') {
    flagBg = C.highPriorityBg; flagBorder = '#FFCAA8'; flagTextColor = C.highPriority; flagWarn = true;
  }

  const lifecycleLabel =
    client.lifestage === 'postpartum' ? 'Postpartum'
    : client.lifestage === 'lactating' ? 'Lactating'
    : 'Pregnant';
  const subLine = client.type === 'pregnant'
    ? `${lifecycleLabel} · ${client.age} yrs · ${client.community}`
    : `Child · ${client.age} · ${client.community}`;

  function handlePlanPress() {
    if (client!.severe) {
      navigation.navigate('ReferralGuardrail', { clientId });
    } else {
      navigation.navigate('Plan', { clientId });
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.primary }}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Go back">
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>Client record</Text>

        {/* Avatar row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 14 }}>
          <View style={[styles.avatar, { backgroundColor: aStyle.bg }]}>
            <Text style={{ color: aStyle.fg, fontSize: 18, fontFamily: fonts.bold, fontWeight: '700' }}>{abbrev}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientSub}>{subLine}</Text>
            <Text style={styles.clientId}>{humanId}</Text>
          </View>
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: -8 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      >
        {/* Supervisor read-only banner */}
        {isSupervisor && (
          <View style={[styles.card, { backgroundColor: C.lb50, borderColor: C.lb200, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            <ShieldCheck size={16} color={C.lb700} />
            <Text style={{ fontSize: 13, fontFamily: fonts.semiBold, color: C.lb700, fontWeight: '600', flex: 1 }}>
              Supervisor view — you can review records but not edit them.
            </Text>
          </View>
        )}

        {/* Linked mother / child card */}
        {linkedClient && (
          <TouchableOpacity
            style={[styles.card, { marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }]}
            onPress={() => navigation.navigate('Client', { clientId: linkedClient.id })}
            accessibilityLabel={`View linked ${linkedClient.type === 'pregnant' ? 'mother' : 'child'} record`}
          >
            <Link size={16} color={C.fg3} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontFamily: fonts.semiBold, color: C.fg3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
                {isChild ? 'Linked mother' : 'Linked child'}
              </Text>
              <Text style={{ fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1 }}>{linkedClient.name}</Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: C.fg3, marginTop: 1 }}>{linkedClient.community}</Text>
            </View>
            <ChevronRight size={16} color={C.fg4} />
          </TouchableOpacity>
        )}

        {/* Referral banner */}
        {client.referred && referral && (
          <View style={[styles.card, { backgroundColor: C.errorBg, borderColor: C.errorBorder, marginBottom: 12 }]}>
            <Text style={{ fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: C.error, marginBottom: 4 }}>
              Referral issued · {referral.facility}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: C.errorDark, marginBottom: referral.status === 'issued' ? 12 : 0 }}>
              {referral.reason}
            </Text>
            {referral.status === 'issued' && (
              <TouchableOpacity
                style={{ backgroundColor: C.error, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, alignSelf: 'flex-start' }}
                onPress={() => confirmReferralSeen(clientId)}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontFamily: fonts.bold, fontWeight: '700' }}>Confirm client was seen</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Risk flag banner */}
        <View style={[styles.card, { backgroundColor: flagBg, borderColor: flagBorder, marginBottom: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <View style={{ marginTop: 1 }}>
              {flagWarn
                ? <AlertTriangle size={16} color={flagTextColor} />
                : <Check size={16} color={flagTextColor} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: flagTextColor, marginBottom: 3 }}>
                {client.flag}
              </Text>
              <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: C.fg2, lineHeight: 18 }}>{client.flagDetail}</Text>
            </View>
          </View>
        </View>

        {/* "Why ranked" card */}
        <View style={[styles.card, { marginBottom: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <BarChart2 size={14} color={C.fg3} />
              <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1 }}>Why NurtureLink ranked this client</Text>
            </View>
            <View style={{ backgroundColor: pStyle.bg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 }}>
              <Text style={{ fontSize: 11, fontFamily: fonts.bold, fontWeight: '700', color: pStyle.color }}>{pStyle.label}</Text>
            </View>
          </View>
          {rankSignals.map((s, i) => (
            <Text key={i} style={{ fontSize: 13, fontFamily: fonts.regular, color: C.fg2, marginBottom: 4 }}>
              {'● '}{s}
            </Text>
          ))}
          <Text style={{ fontSize: 11, fontFamily: fonts.regular, color: C.fg4, marginTop: 8, lineHeight: 16 }}>
            Explainable flag from this client's own visits — you decide who to counsel.
          </Text>
        </View>

        {/* Trend chart card */}
        <View style={[styles.card, { marginBottom: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View>
              <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1 }}>{label}</Text>
              <Text style={{ fontSize: 11, fontFamily: fonts.regular, color: C.fg3 }}>across {visits.length} visits</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 26, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1, lineHeight: 30 }}>{currentValue}</Text>
              {trendDelta ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  {client.trendArrow === 'up'
                    ? <TrendingUp size={13} color={client.trendColor} />
                    : client.trendArrow === 'down'
                    ? <TrendingDown size={13} color={client.trendColor} />
                    : <Minus size={13} color={client.trendColor} />}
                  <Text style={{ fontSize: 13, fontFamily: fonts.semiBold, color: client.trendColor, fontWeight: '600' }}>{trendDelta}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text style={{ fontSize: 12, fontFamily: fonts.medium, color: client.trendColor, fontWeight: '500', marginBottom: 10 }}>
            {client.trendNote}
          </Text>
          {visits.length > 0 && (
            <TrendChart visits={visits} metric={client.metric} trendColor={client.trendColor} />
          )}
        </View>

        {/* Diet diversity card */}
        {lastVisit && <DietDiversityCard lastVisit={lastVisit} />}

        {/* Immunization tracker card — children only */}
        {isChild && (
          <TouchableOpacity
            style={[styles.card, { marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }]}
            onPress={() => navigation.navigate('Immunization', { clientId })}
            accessibilityLabel="View immunization record"
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.lb50, alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} color={C.lb700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1 }}>Immunization record</Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: C.fg3, marginTop: 2 }}>
                {vaccinationCount}/{TOTAL_VACCINES} vaccines recorded · Ghana EPI
              </Text>
            </View>
            <ChevronRight size={16} color={C.fg4} />
          </TouchableOpacity>
        )}

        {/* Visit history */}
        <Text style={styles.sectionHeader}>Visit history</Text>
        {visits.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 36 }}>
            <ClipboardList size={32} color={C.fg4} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 15, fontFamily: fonts.bold, fontWeight: '700', color: C.fg2, marginBottom: 6 }}>No visits yet</Text>
            <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: C.fg3, textAlign: 'center', lineHeight: 20 }}>
              Record a visit to start tracking nutrition trends for this client.
            </Text>
          </View>
        ) : (
          visits.map((v, i) => {
            const isLast = i === visits.length - 1;
            const metricVal = client.metric === 'hb' ? v.hb : client.metric === 'weight' ? v.weight : v.muac;
            return (
              <View
                key={i}
                style={[styles.visitRow, { borderColor: isLast ? C.borderStrong : C.border }]}
              >
                <View style={{ width: 9, height: 9, borderRadius: 4, backgroundColor: client.trendColor, marginTop: 3 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1 }}>{v.date}</Text>
                  <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: C.fg3, marginTop: 2 }}>
                    {`Wt: ${v.weight.toFixed(1)} kg · Hb: ${v.hb !== null ? v.hb.toFixed(1) + ' g/dL' : '—'} · MUAC: ${v.muac} mm`}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ fontSize: 15, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1 }}>
                    {formatMetric(client.metric, metricVal)}
                  </Text>
                  <View style={{
                    backgroundColor: v.synced ? C.successBg : C.warningBg,
                    borderRadius: 20,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      {v.synced && <Check size={10} color={C.success} strokeWidth={3} />}
                      <Text style={{ fontSize: 11, fontFamily: fonts.semiBold, fontWeight: '600', color: v.synced ? C.success : C.warning }}>
                        {v.synced ? 'Synced' : 'Draft — offline'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Bottom action bar ── */}
      <View style={styles.actionBar}>
        {!isSupervisor && (
          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => navigation.navigate('Visit', { clientId })}
            accessibilityLabel="Record visit"
          >
            <Text style={{ fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: C.primary }}>+ Record visit</Text>
          </TouchableOpacity>
        )}

        {visits.length > 0 && (
          <TouchableOpacity
            style={[
              styles.actionBtnFill,
              { backgroundColor: client.severe ? C.error : C.primary },
            ]}
            onPress={handlePlanPress}
            accessibilityLabel={client.severe ? 'Referral required' : 'View plan'}
          >
            <Text style={{ fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: '#fff' }}>
              {client.severe ? 'Referral required' : visits.length > 0 ? 'View plan' : 'Generate plan'}
            </Text>
          </TouchableOpacity>
        )}
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
  headerLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#8D9CA5',
    marginTop: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: {
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#fff',
  },
  clientSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: C.lb300,
    marginTop: 2,
  },
  clientId: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: 'rgba(180,218,251,0.65)',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    padding: 14,
    marginBottom: 0,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: C.fg3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  actionBtnOutline: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  actionBtnFill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
