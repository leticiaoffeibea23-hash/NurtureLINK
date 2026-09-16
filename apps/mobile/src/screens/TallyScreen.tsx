/**
 * TallyScreen — quick community-level tally counter for field visits.
 * CHO can count children screened, SAM referrals, etc. during outreach.
 * All counts reset on demand; never synced (working-session tool only).
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ChevronLeft } from 'lucide-react-native';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Tally'>;

interface TallyItem {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  count: number;
}

const INITIAL_TALLIES: Omit<TallyItem, 'count'>[] = [
  { id: 'screened',    label: 'Screened',        sublabel: 'Children assessed today',         color: '#427CAF' },
  { id: 'muac_yellow', label: 'MUAC Yellow',      sublabel: '115–124 mm — moderate risk',      color: '#B48700' },
  { id: 'muac_red',    label: 'MUAC Red',         sublabel: '< 115 mm — severe, refer',        color: '#C81E1E' },
  { id: 'referred',   label: 'Referred',          sublabel: 'Sent to health facility today',   color: '#FF5A00' },
  { id: 'pregnant',   label: 'Pregnant women',    sublabel: 'ANC contacts made',               color: '#057A55' },
  { id: 'plans',      label: 'Plans given',       sublabel: 'Feeding plans delivered',         color: '#08283B' },
];

export function TallyScreen({ navigation }: Props) {
  const [tallies, setTallies] = useState<TallyItem[]>(
    INITIAL_TALLIES.map((t) => ({ ...t, count: 0 })),
  );

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  function increment(id: string) {
    setTallies((prev) =>
      prev.map((t) => (t.id === id ? { ...t, count: t.count + 1 } : t)),
    );
  }

  function decrement(id: string) {
    setTallies((prev) =>
      prev.map((t) => (t.id === id ? { ...t, count: Math.max(0, t.count - 1) } : t)),
    );
  }

  function resetAll() {
    Alert.alert(
      'Reset all tallies?',
      'This will set all counts back to zero.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setTallies((prev) => prev.map((t) => ({ ...t, count: 0 }))),
        },
      ],
    );
  }

  const totalScreened = tallies.find((t) => t.id === 'screened')?.count ?? 0;
  const totalReferred = tallies.find((t) => t.id === 'referred')?.count ?? 0;
  const referralRate =
    totalScreened > 0 ? Math.round((totalReferred / totalScreened) * 100) : 0;

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color="#FDFDFD" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Outreach tally</Text>
            <Text style={styles.headerDate}>{today}</Text>
          </View>
          <TouchableOpacity
            onPress={resetAll}
            style={styles.resetBtn}
            accessibilityRole="button"
            accessibilityLabel="Reset all tallies"
          >
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Summary strip ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.summaryValue}>{totalScreened}</Text>
            <Text style={styles.summaryLabel}>Screened</Text>
          </View>
          <View style={[styles.summaryCard, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.summaryValue, { color: '#FF5A00' }]}>{totalReferred}</Text>
            <Text style={styles.summaryLabel}>Referred</Text>
          </View>
          <View style={[styles.summaryCard, { flex: 1 }]}>
            <Text style={[styles.summaryValue, { color: totalReferred > 0 ? '#C81E1E' : '#057A55' }]}>
              {referralRate}%
            </Text>
            <Text style={styles.summaryLabel}>Referral rate</Text>
          </View>
        </View>

        {/* ── Tally items ── */}
        <Text style={styles.sectionTitle}>Tap to count</Text>
        {tallies.map((item) => (
          <View key={item.id} style={styles.tallyCard}>
            <View style={[styles.colorBar, { backgroundColor: item.color }]} />
            <View style={styles.tallyBody}>
              <Text style={styles.tallyLabel}>{item.label}</Text>
              <Text style={styles.tallySub}>{item.sublabel}</Text>
            </View>
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => decrement(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Decrease ${item.label}`}
              >
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{item.count}</Text>
              <TouchableOpacity
                style={[styles.counterBtn, styles.counterBtnPrimary]}
                onPress={() => increment(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Increase ${item.label}`}
              >
                <Text style={[styles.counterBtnText, { color: '#FDFDFD' }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Tally counts are session-only and are not saved or synced. Use client registration to record individual visits.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F4F5' },

  // Header
  headerSafe: { backgroundColor: '#08283B' },
  header: {
    backgroundColor: '#08283B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 28, fontFamily: fonts.regular, color: '#FDFDFD', lineHeight: 32 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontFamily: fonts.bold, fontWeight: '700', color: '#FDFDFD' },
  headerDate: { fontSize: 11, fontFamily: fonts.regular, color: '#8D9CA5', marginTop: 2 },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5A6F7C',
  },
  resetBtnText: { fontSize: 13, fontFamily: fonts.semiBold, fontWeight: '600', color: '#92C9F9' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  // Summary
  summaryRow: { flexDirection: 'row', marginBottom: 24 },
  summaryCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryValue: {
    fontSize: 28,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#08283B',
    lineHeight: 34,
  },
  summaryLabel: { fontSize: 11, fontFamily: fonts.regular, color: '#9CA3AF', marginTop: 2 },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Tally card
  tallyCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  colorBar: { width: 5, alignSelf: 'stretch' },
  tallyBody: { flex: 1, paddingVertical: 14, paddingLeft: 14 },
  tallyLabel: { fontSize: 15, fontFamily: fonts.bold, fontWeight: '700', color: '#08283B' },
  tallySub: { fontSize: 12, fontFamily: fonts.regular, color: '#9CA3AF', marginTop: 2 },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    gap: 8,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F2F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  counterBtnPrimary: {
    backgroundColor: '#08283B',
    borderColor: '#08283B',
  },
  counterBtnText: {
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#08283B',
    lineHeight: 24,
  },
  counterValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#08283B',
    minWidth: 36,
    textAlign: 'center',
  },

  // Note
  note: {
    marginTop: 8,
    backgroundColor: '#EFF7FE',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#B4DAFB',
  },
  noteText: { fontSize: 12, fontFamily: fonts.regular, color: '#427CAF', lineHeight: 17 },
});
