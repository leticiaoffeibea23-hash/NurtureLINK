import React, { useEffect, useRef, useState } from 'react';
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
import { useAppStore } from '../store';
import { BottomTabBar } from '../components/BottomTabBar';
import {
  ChevronLeft,
  Wifi,
  WifiOff,
  RefreshCw,
  Users,
  ClipboardList,
  Shield,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  CloudUpload,
} from 'lucide-react-native';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Sync'>;

const BRAND = '#FF5A00';

function formatSyncTime(iso: string | null): string {
  if (!iso) return 'Not yet synced';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return isToday
    ? `Today · ${timeStr}`
    : `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${timeStr}`;
}

export function SyncScreen({ navigation }: Props) {
  const {
    offline,
    syncing,
    lastSyncAt,
    pendingRecords,
    clients,
    referrals,
    sync,
  } = useAppStore();

  const issuedCount = referrals.filter((r) => r.status === 'issued').length;

  // Derive per-type pending counts from store data
  const unsyncedVisits = clients.flatMap((c) => c.visits.filter((v) => !v.synced)).length;
  const unsyncedClients = clients.filter((c) => c.visits.some((v) => !v.synced)).length;

  // Track sync outcome locally
  const [syncResult, setSyncResult] = useState<'idle' | 'success' | 'error'>('idle');
  const prevSyncAtRef = useRef<string | null>(lastSyncAt);
  const syncWasInProgressRef = useRef(false);

  useEffect(() => {
    if (syncing) {
      syncWasInProgressRef.current = true;
      setSyncResult('idle');
    } else if (syncWasInProgressRef.current) {
      syncWasInProgressRef.current = false;
      if (lastSyncAt !== prevSyncAtRef.current) {
        setSyncResult('success');
        prevSyncAtRef.current = lastSyncAt;
      } else {
        setSyncResult('error');
      }
    }
  }, [syncing, lastSyncAt]);

  function handleSync() {
    if (syncing || offline) return;
    setSyncResult('idle');
    sync();
  }

  const dataItems: { icon: React.ReactNode; label: string; count: number }[] = [
    {
      icon: <Users size={18} color="#374151" />,
      label: 'Client profiles',
      count: unsyncedClients,
    },
    {
      icon: <ClipboardList size={18} color="#374151" />,
      label: 'Visit records',
      count: unsyncedVisits,
    },
    {
      icon: <Shield size={18} color="#374151" />,
      label: 'Open referrals',
      count: issuedCount,
    },
    {
      icon: <AlertTriangle size={18} color="#374151" />,
      label: 'Clinical flags',
      count: 0,
    },
    {
      icon: <FileText size={18} color="#374151" />,
      label: 'Nutrition plans',
      count: 0,
    },
  ];

  const hasPending = pendingRecords > 0 || unsyncedVisits > 0 || issuedCount > 0;

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color="#FDFDFD" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Data Sync</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Connectivity strip */}
        <View style={[styles.connStrip, offline ? styles.connStripOffline : styles.connStripOnline]}>
          {offline
            ? <WifiOff size={14} color="#92400E" />
            : <Wifi size={14} color="#065F46" />}
          <Text style={[styles.connText, offline ? styles.connTextOffline : styles.connTextOnline]}>
            {offline ? 'No network connection' : 'Connected to network'}
          </Text>
        </View>
      </SafeAreaView>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Last sync card */}
        <Text style={styles.sectionLabel}>LAST SYNC</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Clock size={20} color="#374151" />
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>
                {lastSyncAt ? formatSyncTime(lastSyncAt) : 'Not yet synced'}
              </Text>
              <Text style={styles.rowDesc}>
                {lastSyncAt
                  ? 'All data was successfully uploaded and downloaded'
                  : 'Tap Sync Now to upload pending records'}
              </Text>
            </View>
          </View>
        </View>

        {/* Pending uploads card */}
        <Text style={styles.sectionLabel}>PENDING UPLOADS</Text>
        <View style={styles.card}>
          {/* Total badge row */}
          <View style={styles.pendingHeader}>
            <View style={styles.row}>
              <CloudUpload size={20} color={hasPending ? BRAND : '#9CA3AF'} />
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>
                  {hasPending
                    ? `${pendingRecords} record${pendingRecords !== 1 ? 's' : ''} waiting to upload`
                    : 'Everything is up to date'}
                </Text>
                <Text style={styles.rowDesc}>
                  {hasPending
                    ? 'These will be sent the next time you sync'
                    : 'No pending records on this device'}
                </Text>
              </View>
            </View>
          </View>

          {/* Per-type breakdown */}
          {dataItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <View style={styles.divider} />
              <View style={styles.dataRow}>
                <View style={styles.dataRowLeft}>
                  {item.icon}
                  <Text style={styles.dataLabel}>{item.label}</Text>
                </View>
                <View style={[styles.countBadge, item.count > 0 ? styles.countBadgePending : styles.countBadgeClear]}>
                  <Text style={[styles.countText, item.count > 0 ? styles.countTextPending : styles.countTextClear]}>
                    {item.count > 0 ? item.count : '✓'}
                  </Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Sync result feedback */}
        {syncResult === 'success' && (
          <View style={styles.resultBanner}>
            <CheckCircle2 size={18} color="#059669" />
            <Text style={styles.resultTextSuccess}>Sync complete · {formatSyncTime(lastSyncAt)}</Text>
          </View>
        )}
        {syncResult === 'error' && (
          <View style={[styles.resultBanner, styles.resultBannerError]}>
            <XCircle size={18} color="#DC2626" />
            <Text style={styles.resultTextError}>Sync failed. Check your connection and try again.</Text>
          </View>
        )}

        {/* Sync Now button */}
        <TouchableOpacity
          style={[
            styles.syncBtn,
            (syncing || offline) && styles.syncBtnDisabled,
          ]}
          onPress={handleSync}
          disabled={syncing || offline}
          accessibilityRole="button"
          accessibilityLabel="Sync now"
        >
          {syncing ? (
            <>
              <ActivityIndicator size="small" color="#FDFDFD" />
              <Text style={styles.syncBtnText}>Syncing…</Text>
            </>
          ) : (
            <>
              <RefreshCw size={18} color="#FDFDFD" />
              <Text style={styles.syncBtnText}>
                {offline ? 'Offline — cannot sync' : 'Sync Now'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {offline && (
          <Text style={styles.offlineHint}>
            Data will sync automatically when the device reconnects.
          </Text>
        )}

        {/* What gets synced info card */}
        <Text style={styles.sectionLabel}>ABOUT SYNC</Text>
        <View style={styles.card}>
          <Text style={styles.infoText}>
            Sync uploads records created offline and downloads updates from the server — including new
            client data, referral status changes, and updated nutrition reference bundles.
          </Text>
          <View style={styles.divider} />
          <Text style={styles.infoText}>
            Emergency referrals are queued for immediate push as soon as connectivity is restored,
            regardless of battery level.
          </Text>
          <View style={styles.divider} />
          <Text style={styles.infoText}>
            Voice packs and full reference bundles are only downloaded when battery is above 30% or
            the device is charging.
          </Text>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <BottomTabBar
        active="sync"
        onHome={() => navigation.navigate('Home')}
        onReferrals={() => navigation.navigate('ReferralsList')}
        onSync={() => {}}
        onProfile={() => navigation.navigate('Settings')}
        referralBadge={issuedCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F4F5',
  },
  headerSafe: {
    backgroundColor: '#08283B',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  connStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  connStripOnline: {
    backgroundColor: '#D1FAE5',
  },
  connStripOffline: {
    backgroundColor: '#FEF3C7',
  },
  connText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  connTextOnline: {
    color: '#065F46',
  },
  connTextOffline: {
    color: '#92400E',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 6,
  },

  card: {
    backgroundColor: '#FDFDFD',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 15,
    marginBottom: 20,
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F1F3',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
    gap: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#08283B',
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#6B7280',
    lineHeight: 17,
  },

  pendingHeader: {
    // no extra style needed, uses row
  },

  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  dataRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dataLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#374151',
    fontWeight: '500',
  },
  countBadge: {
    minWidth: 28,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  countBadgePending: {
    backgroundColor: '#FFF0E8',
  },
  countBadgeClear: {
    backgroundColor: '#D1FAE5',
  },
  countText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  countTextPending: {
    color: BRAND,
  },
  countTextClear: {
    color: '#059669',
  },

  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  resultBannerError: {
    backgroundColor: '#FEE2E2',
  },
  resultTextSuccess: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
  },
  resultTextError: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },

  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 10,
  },
  syncBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  syncBtnText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FDFDFD',
  },
  offlineHint: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },

  infoText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#6B7280',
    lineHeight: 18,
    paddingVertical: 12,
  },
});
