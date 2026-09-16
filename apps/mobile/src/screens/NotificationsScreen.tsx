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
import { useAppStore, AppNotification, NotifKind } from '../store';
import { ChevronLeft, Shield, AlertTriangle, RefreshCw, Package, Volume2, Bell } from 'lucide-react-native';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function iconForKind(kind: NotifKind): { icon: React.ReactNode; bg: string } {
  switch (kind) {
    case 'referral': return { icon: <Shield size={20} color="#C81E1E" />,      bg: '#FDE8E8' };
    case 'risk':     return { icon: <AlertTriangle size={20} color="#B48700" />, bg: '#FFEFE6' };
    case 'sync':     return { icon: <RefreshCw size={20} color="#427CAF" />,    bg: '#EFF7FE' };
    case 'bundle':   return { icon: <Package size={20} color="#6C2BD9" />,      bg: '#F6F5FF' };
    case 'voice':    return { icon: <Volume2 size={20} color="#057A55" />,      bg: '#F3FAF7' };
  }
}

// ─── Notification card ────────────────────────────────────────────────────────

function NotifCard({
  notif,
  onPress,
}: {
  notif: AppNotification;
  onPress: () => void;
}) {
  const icon = iconForKind(notif.kind);

  return (
    <TouchableOpacity
      style={[styles.card, notif.read ? styles.cardRead : styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={notif.title}
    >
      <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
        {icon.icon}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
          {!notif.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
        <Text style={styles.notifTime}>{notif.time}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function NotificationsScreen({ navigation }: Props) {
  const { notifications, markAllRead, markNotifRead, sync } = useAppStore();

  const hasUnread = notifications.some((n) => !n.read);
  const todayNotifs = notifications.filter((n) => n.group === 'today');
  const earlierNotifs = notifications.filter((n) => n.group === 'earlier');

  function handlePress(notif: AppNotification) {
    markNotifRead(notif.id);
    if (notif.target === 'referrals') {
      navigation.navigate('ReferralsList');
    } else if (notif.target.startsWith('client:')) {
      const clientId = notif.target.replace('client:', '');
      navigation.navigate('Client', { clientId });
    } else if (notif.target === 'sync') {
      sync();
    }
  }

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
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {hasUnread ? (
            <TouchableOpacity
              onPress={markAllRead}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 80 }} />
          )}
        </View>
      </SafeAreaView>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={{ marginBottom: 16 }}>
              <Bell size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptyBody}>No notifications right now.</Text>
          </View>
        ) : (
          <>
            {todayNotifs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TODAY</Text>
                {todayNotifs.map((n) => (
                  <NotifCard key={n.id} notif={n} onPress={() => handlePress(n)} />
                ))}
              </View>
            )}
            {earlierNotifs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>EARLIER</Text>
                {earlierNotifs.map((n) => (
                  <NotifCard key={n.id} notif={n} onPress={() => handlePress(n)} />
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
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
  header: {
    backgroundColor: '#08283B',
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
  backArrow: {
    fontSize: 24,
    fontFamily: fonts.semiBold,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markAllText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: '#92C9F9',
    fontWeight: '600',
    width: 80,
    textAlign: 'right',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },

  // Section
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Notification card
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  cardRead: {
    backgroundColor: '#FDFDFD',
  },
  cardUnread: {
    backgroundColor: '#FDFDFD',
    borderColor: '#D1D5DB',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  notifTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#08283B',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5A00',
    flexShrink: 0,
  },
  notifBody: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 5,
  },
  notifTime: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#9CA3AF',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
