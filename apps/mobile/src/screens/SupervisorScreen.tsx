/**
 * SupervisorScreen — district-level overview for supervisors.
 * All data comes from the store (loaded via /supervisor/chos API).
 * Supervisor role (Role = 'sup') is checked from the store; CHO-role users
 * should not see this screen in navigation.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore, ChoActivity } from '../store';
import { ChevronLeft, AlertTriangle, Users, RefreshCw } from 'lucide-react-native';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Supervisor'>;

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  color = '#08283B',
  bg = '#FDFDFD',
}: {
  value: string | number;
  label: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[stat.card, { backgroundColor: bg }]}>
      <Text style={[stat.value, { color }]}>{value}</Text>
      <Text style={stat.label}>{label}</Text>
    </View>
  );
}

function ChoRow({ cho }: { cho: ChoActivity }) {
  const coverage = cho.clients > 0 ? Math.round((cho.visited / cho.clients) * 100) : 0;
  return (
    <View style={styles.choCard}>
      <View style={styles.choAvatar}>
        <Text style={styles.choAvatarText}>
          {cho.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
        </Text>
      </View>
      <View style={styles.choBody}>
        <View style={styles.choTopRow}>
          <Text style={styles.choName} numberOfLines={1}>{cho.name}</Text>
          <View
            style={[
              styles.syncBadge,
              { backgroundColor: cho.synced ? '#F3FAF7' : '#FFF9E6' },
            ]}
          >
            <Text
              style={[
                styles.syncBadgeText,
                { color: cho.synced ? '#057A55' : '#B48700' },
              ]}
            >
              {cho.synced ? 'Synced' : 'Behind'}
            </Text>
          </View>
        </View>
        <Text style={styles.choZone}>{cho.zone} · last sync {cho.lastSync}</Text>
        <View style={styles.choCovRow}>
          <View style={styles.choProgressBg}>
            <View style={[styles.choProgressFill, { width: `${coverage}%` }]} />
          </View>
          <Text style={styles.choProgressLabel}>{coverage}% visited</Text>
          {cho.pending > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{cho.pending} pending</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function SupervisorScreen({ navigation }: Props) {
  const {
    referrals,
    choActivity,
    supervisorLoading,
    loadSupervisorData,
    referenceBundle,
    currentUser,
  } = useAppStore();
  const [tab, setTab] = useState<'overview' | 'chos'>('overview');

  useEffect(() => {
    loadSupervisorData();
  }, []);

  const totalClients = choActivity.reduce((s, c) => s + c.clients, 0);
  const totalReferrals = referrals.length;
  const pendingReferrals = referrals.filter((r) => r.status === 'issued').length;
  const syncBehind = choActivity.filter((c) => !c.synced).length;
  const totalVisited = choActivity.reduce((s, c) => s + c.visited, 0);

  const district = currentUser?.facilityDistrict ?? 'District';

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const bundleVersion = referenceBundle?.version ?? '—';
  const devicesOnLatest = choActivity.filter((c) => c.synced).length;

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
            <Text style={styles.headerTitle}>District overview</Text>
            <Text style={styles.headerDate}>{district} · {today}</Text>
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => loadSupervisorData()}
            accessibilityRole="button"
            accessibilityLabel="Refresh CHO data"
          >
            <RefreshCw size={18} color="#FDFDFD" />
          </TouchableOpacity>
        </View>

        {/* Tab bar */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === 'overview' && styles.tabActive]}
            onPress={() => setTab('overview')}
            accessibilityRole="button"
          >
            <Text style={[styles.tabText, tab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'chos' && styles.tabActive]}
            onPress={() => setTab('chos')}
            accessibilityRole="button"
          >
            <Text style={[styles.tabText, tab === 'chos' && styles.tabTextActive]}>
              CHOs ({choActivity.length})
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'overview' ? (
          <>
            {/* Sync alert if any CHO behind */}
            {syncBehind > 0 && (
              <View style={styles.alertBanner}>
                <AlertTriangle size={20} color="#B48700" />
                <View style={styles.alertBody}>
                  <Text style={styles.alertTitle}>
                    {syncBehind} CHO{syncBehind !== 1 ? 's' : ''} not synced recently
                  </Text>
                  <Text style={styles.alertSub}>Check the CHOs tab for details</Text>
                </View>
              </View>
            )}

            {/* Caseload stats */}
            <Text style={styles.sectionTitle}>Caseload</Text>
            <View style={styles.statGrid}>
              <StatCard value={totalClients} label="Total clients" />
              <StatCard
                value={pendingReferrals}
                label="Awaiting care"
                color="#B48700"
                bg="#FFF9E6"
              />
              <StatCard
                value={totalReferrals}
                label="Referrals"
                color="#FF5A00"
                bg="#FFEFE6"
              />
              <StatCard
                value={syncBehind}
                label="CHOs behind"
                color={syncBehind > 0 ? '#C81E1E' : '#057A55'}
                bg={syncBehind > 0 ? '#FDF2F2' : '#F3FAF7'}
              />
            </View>

            {/* Coverage */}
            {choActivity.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Visit coverage this month</Text>
                <View style={styles.coverageCard}>
                  {choActivity.map((cho) => {
                    const pct = cho.clients > 0 ? Math.round((cho.visited / cho.clients) * 100) : 0;
                    return (
                      <View key={cho.id} style={styles.coverageRow}>
                        <Text style={styles.coverageName} numberOfLines={1}>
                          {cho.name.split(' ')[0]}
                        </Text>
                        <View style={styles.coverageBarWrap}>
                          <View style={styles.coverageBarBg}>
                            <View style={[styles.coverageBarFill, { width: `${pct}%` }]} />
                          </View>
                        </View>
                        <Text style={styles.coveragePct}>{pct}%</Text>
                      </View>
                    );
                  })}
                  {choActivity.length > 0 && (
                    <View style={[styles.coverageRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#F0F1F3', paddingTop: 8 }]}>
                      <Text style={[styles.coverageName, { color: '#374151' }]}>Total</Text>
                      <View style={styles.coverageBarWrap}>
                        <View style={styles.coverageBarBg}>
                          <View style={[styles.coverageBarFill, { width: `${totalClients > 0 ? Math.round((totalVisited / totalClients) * 100) : 0}%` }]} />
                        </View>
                      </View>
                      <Text style={[styles.coveragePct, { color: '#374151' }]}>
                        {totalClients > 0 ? Math.round((totalVisited / totalClients) * 100) : 0}%
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Referral pipeline */}
            <Text style={styles.sectionTitle}>Referral pipeline</Text>
            <View style={styles.pipelineCard}>
              <View style={styles.pipelineRow}>
                <View style={[styles.pipelineDot, { backgroundColor: '#FF5A00' }]} />
                <Text style={styles.pipelineLabel}>Issued</Text>
                <Text style={styles.pipelineValue}>{pendingReferrals}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.pipelineRow}>
                <View style={[styles.pipelineDot, { backgroundColor: '#057A55' }]} />
                <Text style={styles.pipelineLabel}>Seen at facility</Text>
                <Text style={styles.pipelineValue}>{totalReferrals - pendingReferrals}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.pipelineRow}>
                <View style={[styles.pipelineDot, { backgroundColor: '#9CA3AF' }]} />
                <Text style={styles.pipelineLabel}>Overdue ({'>'} 7 days)</Text>
                <Text style={styles.pipelineValue}>
                  {referrals.filter((r) => {
                    if (r.status !== 'issued') return false;
                    const issued = new Date(r.at);
                    return !isNaN(issued.getTime()) && Date.now() - issued.getTime() > 7 * 86400000;
                  }).length}
                </Text>
              </View>
            </View>

            {/* Reference bundle */}
            <Text style={styles.sectionTitle}>Reference bundle</Text>
            <View style={styles.bundleCard}>
              <View style={styles.bundleRow}>
                <Text style={styles.bundleLabel}>Active version</Text>
                <Text style={styles.bundleValue}>{bundleVersion}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.bundleRow}>
                <Text style={styles.bundleLabel}>Devices on latest</Text>
                <Text style={styles.bundleValue}>
                  {devicesOnLatest} / {choActivity.length}
                </Text>
              </View>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.bundlePushBtn} accessibilityRole="button">
                <Text style={styles.bundlePushBtnText}>Push update to devices</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Community health officers</Text>

            {supervisorLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#427CAF" />
                <Text style={styles.loadingText}>Loading CHO data…</Text>
              </View>
            ) : choActivity.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No CHOs in district</Text>
                <Text style={styles.emptyBody}>
                  CHOs will appear here once they register and sync their first visit.
                </Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => loadSupervisorData()}
                  accessibilityRole="button"
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              choActivity.map((cho) => (
                <ChoRow key={cho.id} cho={cho} />
              ))
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const stat = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 4,
    minWidth: '45%',
  },
  value: { fontSize: 28, fontFamily: fonts.bold, fontWeight: '800', lineHeight: 34 },
  label: { fontSize: 11, fontFamily: fonts.regular, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F4F5' },

  // Header
  headerSafe: { backgroundColor: '#08283B' },
  header: {
    backgroundColor: '#08283B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontFamily: fonts.bold, fontWeight: '700', color: '#FDFDFD' },
  headerDate: { fontSize: 11, fontFamily: fonts.regular, color: '#8D9CA5', marginTop: 2 },

  // Tabs
  tabRow: {
    backgroundColor: '#08283B',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 0,
    gap: 0,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#FF5A00' },
  tabText: { fontSize: 14, fontFamily: fonts.medium, fontWeight: '500', color: '#8D9CA5' },
  tabTextActive: { fontFamily: fonts.bold, color: '#FDFDFD', fontWeight: '700' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  // Alert
  alertBanner: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFE18A',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: '#08283B' },
  alertSub: { fontSize: 12, fontFamily: fonts.regular, color: '#8C6900', marginTop: 2 },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 8,
  },

  // Stat grid
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },

  // Coverage
  coverageCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  coverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coverageName: { width: 60, fontSize: 12, fontFamily: fonts.semiBold, fontWeight: '600', color: '#374151' },
  coverageBarWrap: { flex: 1 },
  coverageBarBg: {
    height: 8,
    backgroundColor: '#F2F4F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  coverageBarFill: {
    height: '100%',
    backgroundColor: '#427CAF',
    borderRadius: 4,
  },
  coveragePct: { width: 36, fontSize: 12, fontFamily: fonts.semiBold, fontWeight: '600', color: '#374151', textAlign: 'right' },

  // Pipeline
  pipelineCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 12,
  },
  pipelineDot: { width: 10, height: 10, borderRadius: 5 },
  pipelineLabel: { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: '#374151' },
  pipelineValue: { fontSize: 16, fontFamily: fonts.bold, fontWeight: '700', color: '#08283B' },
  divider: { height: 1, backgroundColor: '#F0F1F3', marginVertical: 10 },

  // Bundle
  bundleCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  bundleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  bundleLabel: { fontSize: 14, fontFamily: fonts.regular, color: '#374151' },
  bundleValue: { fontSize: 14, fontFamily: fonts.semiBold, fontWeight: '600', color: '#08283B' },
  bundlePushBtn: {
    marginTop: 14,
    backgroundColor: '#08283B',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bundlePushBtnText: { fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: '#FDFDFD' },

  // CHO cards
  choCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  choAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6EAEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choAvatarText: { fontSize: 15, fontFamily: fonts.bold, fontWeight: '700', color: '#08283B' },
  choBody: { flex: 1 },
  choTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  choName: { fontSize: 15, fontFamily: fonts.bold, fontWeight: '700', color: '#08283B', flex: 1, marginRight: 8 },
  syncBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  syncBadgeText: { fontSize: 11, fontFamily: fonts.semiBold, fontWeight: '600' },
  choZone: { fontSize: 12, fontFamily: fonts.regular, color: '#9CA3AF', marginBottom: 8 },
  choCovRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  choProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#F2F4F5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  choProgressFill: {
    height: '100%',
    backgroundColor: '#08283B',
    borderRadius: 3,
  },
  choProgressLabel: { fontSize: 11, fontFamily: fonts.semiBold, fontWeight: '600', color: '#374151' },
  pendingBadge: {
    backgroundColor: '#FFEFE6',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
  },
  pendingBadgeText: { fontSize: 10, fontFamily: fonts.semiBold, fontWeight: '600', color: '#B54000' },

  // Loading / empty states
  loadingState: { alignItems: 'center', paddingVertical: 48 },
  loadingText: { fontSize: 14, fontFamily: fonts.regular, color: '#9CA3AF', marginTop: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.semiBold, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 6 },
  emptyBody: { fontSize: 13, fontFamily: fonts.regular, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  retryBtn: {
    marginTop: 18,
    backgroundColor: '#08283B',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryBtnText: { fontSize: 14, fontFamily: fonts.semiBold, fontWeight: '600', color: '#FDFDFD' },
});
