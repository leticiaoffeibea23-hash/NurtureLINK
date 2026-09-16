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
  PLANS,
  PlanFood,
  priorityStyle,
} from '../store';
import { ChevronLeft, X, RefreshCw, Check, Shield, Info } from 'lucide-react-native';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Plan'>;

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:         '#08283B',
  accent:          '#FF5A00',
  bg:              '#F2F4F5',
  surface:         '#FDFDFD',
  border:          '#E5E7EB',
  fg1:             '#08283B',
  fg2:             '#374151',
  fg3:             '#6B7280',
  fg4:             '#9CA3AF',
  lb50:            '#EFF7FE',
  lb200:           '#B4DAFB',
  lb700:           '#427CAF',
  success:         '#057A55',
  successBg:       '#F3FAF7',
  successBorder:   '#BCF0DA',
  warning:         '#B48700',
  warningBg:       '#FFF9E6',
  error:           '#C81E1E',
  errorBg:         '#FDF2F2',
  highPriority:    '#B54000',
  highPriorityBg:  '#FFEFE6',
  warningDark:     '#8C6900',
};

// ─── Group tints & dots ───────────────────────────────────────────────────────
const GROUP_TINT: Record<string, string> = {
  vita:    '#F3FAF7',
  legumes: '#FFEFE6',
  eggs:    '#FDF2F8',
  grains:  '#FFF9E6',
  flesh:   '#EDFAFA',
  dairy:   '#EFF7FE',
  veg:     '#F6F5FF',
};
const GROUP_DOT: Record<string, string> = {
  vita:    '#057A55',
  legumes: '#B54000',
  eggs:    '#BF125D',
  grains:  '#B48700',
  flesh:   '#036672',
  dairy:   '#427CAF',
  veg:     '#6C2BD9',
};

function tierStyle(tier: string): { color: string; bg: string } {
  const t = tier.toLowerCase();
  if (t.includes('free') || t.includes('garden')) return { color: C.success,      bg: C.successBg };
  if (t.includes('low'))                           return { color: C.highPriority, bg: C.highPriorityBg };
  return { color: C.fg2, bg: '#ECECEB' };
}

function adequacyColor(pct: number): string {
  if (pct >= 90) return C.success;
  if (pct >= 70) return C.warning;
  return C.error;
}

// ─── Generic plan fallback ────────────────────────────────────────────────────
import { DemoClient } from '../store';

function genericPlan(client: DemoClient) {
  const pStyle = priorityStyle(client.priority);
  return {
    seasonNote: `In season · November · ${client.community} zone`,
    targetNote: `${client.name}'s ${client.flag.toLowerCase()}. This plan uses locally available, affordable foods to support recovery.`,
    foods: [
      { name: 'Enriched koko',   local: 'Koko',     group: 'grains',  tier: 'Low cost',       why: 'Energy-dense base for daily meals.' },
      { name: 'Cowpea (beans)',  local: 'Tuya',     group: 'legumes', tier: 'Low cost',       why: 'Iron & protein from a local staple.' },
      { name: 'Moringa leaves',  local: 'Zogale',   group: 'vita',    tier: 'Free / garden',  why: 'Vitamins A & C; grows locally.' },
    ],
    alternates: [
      { name: 'Boiled egg', local: 'Gala', group: 'eggs', tier: 'Market', why: 'Protein when affordable.' },
    ],
    adequacy: [
      { label: 'Energy',  pct: 80 },
      { label: 'Protein', pct: 85 },
      { label: 'Iron',    pct: 75 },
    ],
    rationale: [
      `Flag: ${client.flag}`,
      'Foods chosen are available and affordable in this community.',
      'Review with client and adjust based on household budget.',
    ],
  };
}

// ─── Food card ────────────────────────────────────────────────────────────────
function FoodCard({
  food,
  onRemove,
}: {
  food: PlanFood;
  onRemove: () => void;
}) {
  const tint = GROUP_TINT[food.group] ?? '#F5F5F5';
  const dot  = GROUP_DOT[food.group]  ?? '#9CA3AF';
  const ts   = tierStyle(food.tier);

  return (
    <View style={styles.foodCard}>
      {/* icon box */}
      <View style={[styles.foodIconBox, { backgroundColor: tint }]}>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: dot }} />
      </View>
      {/* text */}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1 }}>{food.name}</Text>
        <Text style={{ fontSize: 12, fontFamily: fonts.regular, fontStyle: 'italic', color: C.fg3 }}>{food.local}</Text>
        <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: C.fg2, lineHeight: 17 }}>{food.why}</Text>
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <View style={{ backgroundColor: ts.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
            <Text style={{ fontSize: 10, fontFamily: fonts.bold, fontWeight: '700', color: ts.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {food.tier}
            </Text>
          </View>
        </View>
      </View>
      {/* remove */}
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={onRemove}
        accessibilityLabel={`Remove ${food.name}`}
      >
        <X size={18} color={C.fg4} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function PlanScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const store = useAppStore();
  const client = store.clients.find((c) => c.id === clientId);
  const edits  = store.planEdits[clientId] ?? { removed: [], added: [] };

  if (!client) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: C.fg3 }}>Client not found.</Text>
      </View>
    );
  }

  const basePlan  = store.plans[clientId] ?? PLANS[clientId] ?? genericPlan(client);
  const isAiPlan  = store.plans[clientId] != null || PLANS[clientId] != null;

  // Compute visible foods: base foods + added alternates, minus removed
  const allFoods: PlanFood[] = [
    ...basePlan.foods,
    ...(basePlan.alternates ?? []).filter((a) => edits.added.includes(a.name)),
  ].filter((f) => !edits.removed.includes(f.name));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.primary }}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Go back">
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ marginTop: 4 }}>
          <Text style={styles.headerTitle}>Feeding plan</Text>
          <Text style={styles.headerSub}>{client.name}</Text>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
      >
        {/* Status badge row */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {isAiPlan ? (
            <View style={{ backgroundColor: C.successBg, borderWidth: 1, borderColor: C.successBorder, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontFamily: fonts.bold, fontWeight: '700', color: C.success }}>AI enriched</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: C.lb50, borderWidth: 1, borderColor: C.lb200, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontFamily: fonts.bold, fontWeight: '700', color: C.lb700 }}>Deterministic</Text>
            </View>
          )}
          <View style={{ backgroundColor: C.successBg, borderWidth: 1, borderColor: C.successBorder, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, fontFamily: fonts.semiBold, fontWeight: '600', color: C.success }}>
              {basePlan.seasonNote}
            </Text>
          </View>
        </View>

        {/* Target note */}
        <Text style={{ fontSize: 14, fontFamily: fonts.regular, color: C.fg2, lineHeight: 21, marginBottom: 18 }}>
          {basePlan.targetNote}
        </Text>

        {/* ── Recommended foods ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={styles.sectionTitle}>Recommended foods</Text>
          <TouchableOpacity
            style={{ backgroundColor: C.lb50, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
            onPress={() => store.regeneratePlan()}
            accessibilityLabel="Regenerate plan"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <RefreshCw size={13} color={C.lb700} />
              <Text style={{ fontSize: 13, fontFamily: fonts.semiBold, fontWeight: '600', color: C.lb700 }}>Regenerate</Text>
            </View>
          </TouchableOpacity>
        </View>

        {allFoods.map((food) => (
          <FoodCard
            key={food.name}
            food={food}
            onRemove={() => store.removePlanFood(clientId, food.name)}
          />
        ))}

        {/* Add another food */}
        <TouchableOpacity
          style={styles.addFoodBtn}
          onPress={() => store.addPlanAlternate(clientId)}
          accessibilityLabel="Add another local food"
        >
          <Text style={{ fontSize: 13, fontFamily: fonts.semiBold, color: '#395362', fontWeight: '600' }}>+ Add another local food</Text>
        </TouchableOpacity>

        {/* ── Nutrient adequacy ── */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Nutrient adequacy</Text>
        <View style={styles.adequacyCard}>
          {basePlan.adequacy.map((row) => {
            const col = adequacyColor(row.pct);
            return (
              <View key={row.label} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: C.fg2 }}>{row.label}</Text>
                  <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: col }}>{row.pct}%</Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#ECECEB', borderRadius: 8, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.min(row.pct, 100)}%`, height: '100%', backgroundColor: col, borderRadius: 8 }} />
                </View>
              </View>
            );
          })}
          <Text style={{ fontSize: 11, fontFamily: fonts.regular, color: C.fg4, marginTop: 4 }}>
            Against WHO/IYCF targets · computed on-device
          </Text>
        </View>

        {/* ── Why this plan ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 10 }}>
          <Info size={14} color={C.fg3} />
          <Text style={styles.sectionTitle}>Why this plan</Text>
        </View>
        <View style={[styles.rationaleCard]}>
          {basePlan.rationale.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: i < basePlan.rationale.length - 1 ? 10 : 0 }}>
              <Check size={14} color={C.lb700} strokeWidth={3} />
              <Text style={{ flex: 1, fontSize: 13, fontFamily: fonts.regular, color: C.fg1, lineHeight: 18 }}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Bottom action bar ── */}
      <View style={styles.actionBar}>
        {/* Responsible AI note */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
          <Shield size={14} color={C.warningDark} />
          <Text style={{ flex: 1, fontSize: 12, fontFamily: fonts.regular, color: C.warningDark, lineHeight: 17 }}>
            You remain responsible for this advice — edit it, then approve before sending.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={() => navigation.navigate('Voice', { clientId })}
          accessibilityLabel="Approve and create voice note"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Check size={16} color="#FFFFFF" strokeWidth={3} />
            <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.bold, fontWeight: '700' }}>Approve & create voice note</Text>
          </View>
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
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: C.fg1,
    marginBottom: 0,
  },
  foodCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    padding: 13,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  foodIconBox: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addFoodBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#B2BCC2',
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 4,
  },
  adequacyCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    padding: 16,
  },
  rationaleCard: {
    backgroundColor: C.lb50,
    borderWidth: 1,
    borderColor: C.lb200,
    borderRadius: 15,
    padding: 16,
  },
  actionBar: {
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
  approveBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
});
