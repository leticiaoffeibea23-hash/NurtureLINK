import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { BottomTabBar } from '../components/BottomTabBar';
import {
  useAppStore,
  DemoClient,
  initials,
  avatarStyle,
  priorityStyle,
  displayName,
} from '../store';
import { Bell, WifiOff, Check, Search, X, Plus, TrendingUp, ChevronRight } from 'lucide-react-native';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// ─── Greeting helpers ─────────────────────────────────────────────────────────

function greeting(lang: 'en' | 'dag'): string {
  const hour = new Date().getHours();
  if (lang === 'dag') return 'Dasiba';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Sync status banner ───────────────────────────────────────────────────────

function formatSyncTime(iso: string | null): string {
  if (!iso) return 'Not yet synced';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return isToday
    ? `Last sync today · ${timeStr}`
    : `Last sync ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${timeStr}`;
}

function SyncBanner({
  offline,
  syncing,
  pendingRecords,
  lastSyncAt,
  onSync,
}: {
  offline: boolean;
  syncing: boolean;
  pendingRecords: number;
  lastSyncAt: string | null;
  onSync: () => void;
}) {
  if (offline) {
    return (
      <View style={[banner.wrap, banner.warnWrap]}>
        <View style={banner.warnIconBox}>
          <WifiOff size={18} color="#8C6900" />
        </View>
        <View style={banner.mid}>
          <Text style={banner.titleDark}>
            Working offline · {pendingRecords} record{pendingRecords !== 1 ? 's' : ''} saved on device
          </Text>
          <Text style={banner.subWarn}>Syncs automatically when back online</Text>
        </View>
        <TouchableOpacity style={banner.warnBtn} onPress={onSync} accessibilityRole="button">
          <Text style={banner.warnBtnText}>Try now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (syncing) {
    return (
      <View style={[banner.wrap, banner.blueWrap]}>
        <ActivityIndicator color="#427CAF" size="small" style={{ marginRight: 12 }} />
        <View style={banner.mid}>
          <Text style={banner.titleBlue}>Syncing {pendingRecords} record{pendingRecords !== 1 ? 's' : ''}…</Text>
          <Text style={banner.subBlue}>Uploading to DHIMS2</Text>
        </View>
      </View>
    );
  }

  if (pendingRecords > 0) {
    return (
      <View style={[banner.wrap, banner.blueWrap]}>
        <View style={banner.mid}>
          <Text style={banner.titleBlue}>{pendingRecords} record{pendingRecords !== 1 ? 's' : ''} ready to sync</Text>
          <Text style={banner.subBlue}>Online · tap to upload now</Text>
        </View>
        <TouchableOpacity style={banner.darkBtn} onPress={onSync} accessibilityRole="button">
          <Text style={banner.darkBtnText}>Sync now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[banner.wrap, banner.greenWrap]}>
      <View style={banner.greenIconBox}>
        <Check size={16} color="#057A55" strokeWidth={3} />
      </View>
      <View style={banner.mid}>
        <Text style={banner.titleGreen}>All records synced</Text>
        <Text style={banner.subGreen}>{formatSyncTime(lastSyncAt)}</Text>
      </View>
    </View>
  );
}

// ─── Client card ─────────────────────────────────────────────────────────────

function ClientCard({
  client,
  rank,
  onPress,
}: {
  client: DemoClient;
  rank?: number;
  onPress: () => void;
}) {
  const av = avatarStyle(client.type);
  const ps = priorityStyle(client.priority);
  const ins = initials(client.name);
  const showRank = rank !== undefined;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${client.name}, ${ps.label}`}
    >
      {showRank && (
        <Text style={styles.rank}>#{rank}</Text>
      )}
      <View
        style={[
          styles.avatar,
          { backgroundColor: av.bg },
          !showRank && styles.avatarLarge,
        ]}
      >
        <Text style={[styles.avatarText, { color: av.fg }]}>{ins}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.clientName} numberOfLines={1}>{client.name}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: ps.bg }]}>
            <Text style={[styles.priorityText, { color: ps.color }]}>{ps.label.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.clientMeta}>
          {typeof client.age === 'number' ? `${client.age} yrs` : client.age} · {client.community}
        </Text>
        <View style={styles.flagRow}>
          <View style={[styles.flagDot, { backgroundColor: client.trendColor }]} />
          <Text style={styles.flagText} numberOfLines={1}>{client.flag}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    clients,
    referrals,
    notifications,
    offline,
    syncing,
    lastSyncAt,
    pendingRecords,
    uiLang,
    currentUser,
    dataLoading,
  } = useAppStore();

  const [query, setQuery] = useState('');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingReferrals = referrals.filter((r) => r.status === 'issued').length;

  const isSearching = query.trim().length > 0;

  const followUpClients = clients
    .filter((c) => c.priority === 'urgent' || c.priority === 'high')
    .sort((a, b) => (a.priority === 'urgent' && b.priority !== 'urgent' ? -1 : b.priority === 'urgent' && a.priority !== 'urgent' ? 1 : 0));

  const stableClients = clients.filter(
    (c) => c.priority === 'stable' || c.priority === 'new',
  );

  const searchResults = isSearching
    ? clients.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.community.toLowerCase().includes(q) ||
          c.flag.toLowerCase().includes(q)
        );
      })
    : [];

  const todayLabel = 'Needs follow-up today';
  const stableLabel = 'Stable · monitoring';

  // Date string
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ── */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greetingTime}>{greeting(uiLang)}</Text>
            <Text style={styles.greetingName}>{currentUser ? displayName(currentUser) : 'Health Worker'}</Text>
            <Text style={styles.greetingDate}>{dateStr}{currentUser?.facilityName ? ` · ${currentUser.facilityName}` : ''}</Text>
          </View>
          <View style={styles.greetingActions}>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="button"
              accessibilityLabel="Register new client"
            >
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Bell size={20} color="#08283B" />
              {unreadCount > 0 && <View style={styles.bellDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Sync banner ── */}
        <View style={styles.bannerWrap}>
          <SyncBanner
            offline={offline}
            syncing={syncing}
            pendingRecords={pendingRecords}
            lastSyncAt={lastSyncAt}
            onSync={() => navigation.navigate('Sync')}
          />
        </View>

        {/* ── DHIMS2 monthly report card (G11) ── */}
        <TouchableOpacity
          style={styles.dhimsCard}
          onPress={() => navigation.navigate('Tally')}
          accessibilityRole="button"
          accessibilityLabel="Monthly DHIMS2 report"
          activeOpacity={0.8}
        >
          <View style={styles.dhimsIconBox}>
            <TrendingUp size={18} color="#427CAF" />
          </View>
          <View style={styles.dhimsMid}>
            <Text style={styles.dhimsTitle}>
              {now.toLocaleDateString('en-GB', { month: 'long' })} report · DHIMS2
            </Text>
            <Text style={styles.dhimsSub}>Tap to review and submit your monthly tally</Text>
          </View>
          <ChevronRight size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {/* ── Search bar ── */}
        <View style={styles.searchWrap}>
          <View style={styles.searchIconWrap}>
            <Search size={17} color="#9CA3AF" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients…"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            accessibilityLabel="Search clients"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={styles.searchClear}
            >
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Content ── */}
        {dataLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#427CAF" />
            <Text style={[styles.emptyStateSub, { marginTop: 12 }]}>Loading your caseload…</Text>
          </View>
        ) : isSearching ? (
          /* Search results */
          searchResults.length > 0 ? (
            <View>
              <Text style={styles.sectionHeader}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </Text>
              {searchResults.map((c) => (
                <ClientCard
                  key={c.id}
                  client={c}
                  onPress={() => navigation.navigate('Client', { clientId: c.id })}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No clients found</Text>
              <Text style={styles.emptyStateSub}>Try a different name or community</Text>
            </View>
          )
        ) : clients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No clients yet</Text>
            <Text style={styles.emptyStateSub}>Tap + to register your first client</Text>
          </View>
        ) : (
          <>
            {/* ── Priority follow-up ── */}
            {followUpClients.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeader}>{todayLabel}</Text>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{followUpClients.length}</Text>
                  </View>
                </View>
                <Text style={styles.sectionSub}>
                  Ranked by NurtureLink from each client's own visit trend
                </Text>
                {followUpClients.map((c, i) => (
                  <ClientCard
                    key={c.id}
                    client={c}
                    rank={i + 1}
                    onPress={() => navigation.navigate('Client', { clientId: c.id })}
                  />
                ))}
              </View>
            )}

            {/* ── Stable / monitoring ── */}
            {stableClients.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeader}>{stableLabel}</Text>
                </View>
                {stableClients.map((c) => (
                  <ClientCard
                    key={c.id}
                    client={c}
                    onPress={() => navigation.navigate('Client', { clientId: c.id })}
                  />
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      <BottomTabBar
        active="home"
        onHome={() => {}}
        onReferrals={() => navigation.navigate('ReferralsList')}
        onSync={() => navigation.navigate('Sync')}
        onProfile={() => navigation.navigate('Settings')}
        referralBadge={pendingReferrals}
      />
    </View>
  );
}

// ─── Banner styles ────────────────────────────────────────────────────────────

const banner = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  mid: { flex: 1 },

  // Warning (offline)
  warnWrap: { backgroundColor: '#FFF9E6', borderColor: '#FFE18A' },
  warnIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFEBB0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleDark: { fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: '#08283B' },
  subWarn: { fontSize: 12, fontFamily: fonts.regular, color: '#8C6900', marginTop: 2 },
  warnBtn: {
    backgroundColor: '#FFE18A',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  warnBtnText: { fontSize: 12, fontFamily: fonts.semiBold, fontWeight: '600', color: '#08283B' },

  // Blue (syncing / pending)
  blueWrap: { backgroundColor: '#EFF7FE', borderColor: '#B4DAFB' },
  titleBlue: { fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: '#08283B' },
  subBlue: { fontSize: 12, fontFamily: fonts.regular, color: '#427CAF', marginTop: 2 },
  darkBtn: {
    backgroundColor: '#08283B',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  darkBtnText: { fontSize: 12, fontFamily: fonts.semiBold, fontWeight: '600', color: '#FFFFFF' },

  // Green (synced)
  greenWrap: { backgroundColor: '#F3FAF7', borderColor: '#BCF0DA' },
  greenIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#BCF0DA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleGreen: { fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: '#057A55' },
  subGreen: { fontSize: 12, fontFamily: fonts.regular, color: '#057A55', marginTop: 2, opacity: 0.8 },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F4F5',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Greeting
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greetingLeft: { flex: 1, paddingRight: 12 },
  greetingTime: { fontSize: 13, fontFamily: fonts.regular, color: '#6B7280', marginBottom: 2 },
  greetingName: { fontSize: 22, fontFamily: fonts.bold, fontWeight: '700', color: '#08283B', lineHeight: 28 },
  greetingDate: { fontSize: 13, fontFamily: fonts.regular, color: '#6B7280', marginTop: 3 },
  greetingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  registerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#08283B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5A00',
    borderWidth: 1.5,
    borderColor: '#FDFDFD',
  },

  // Banner
  bannerWrap: { marginBottom: 10 },

  // DHIMS2 card
  dhimsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#B4DAFB',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 14,
  },
  dhimsIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#EFF7FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dhimsMid: { flex: 1 },
  dhimsTitle: { fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: '#08283B' },
  dhimsSub: { fontSize: 11, fontFamily: fonts.regular, color: '#427CAF', marginTop: 1 },

  // Search
  searchWrap: {
    position: 'relative',
    marginBottom: 20,
  },
  searchIconWrap: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#08283B',
    height: 46,
  },
  searchClear: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  // Sections
  section: { marginBottom: 8 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#08283B',
  },
  sectionBadge: {
    backgroundColor: '#FFEFE6',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#B54000',
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#9CA3AF',
    marginBottom: 12,
    lineHeight: 16,
  },

  // Client card
  card: {
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rank: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#9CA3AF',
    width: 26,
    textAlign: 'center',
    marginRight: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLarge: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  cardBody: { flex: 1 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#08283B',
    flex: 1,
  },
  priorityBadge: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  clientMeta: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#9CA3AF',
    marginBottom: 5,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flagDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  flagText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#374151',
    flex: 1,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  emptyStateSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#9CA3AF',
  },
});
