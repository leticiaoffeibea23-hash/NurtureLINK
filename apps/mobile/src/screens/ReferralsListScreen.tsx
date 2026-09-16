import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore, DemoReferral, initials, avatarStyle } from '../store';
import { BottomTabBar } from '../components/BottomTabBar';
import {
  ChevronLeft, Check, Phone, Shield, Clock, CalendarDays, X,
} from 'lucide-react-native';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ReferralsList'>;

// ─── Confirm modal ────────────────────────────────────────────────────────────

const CONFIRM_SOURCES = [
  { id: 'facility',   label: 'Facility feedback' },
  { id: 'phone_call', label: 'Caregiver phone call' },
  { id: 'home_visit', label: 'Home follow-up' },
  { id: 'slip',       label: 'Referral slip returned' },
  { id: 'supervisor', label: 'Supervisor report' },
];

const OUTCOMES = [
  { id: 'improving',     label: 'Improving',     color: '#057A55', bg: '#F3FAF7', border: '#BCF0DA' },
  { id: 'no_change',     label: 'No change',      color: '#B48700', bg: '#FFF9E6', border: '#FFE18A' },
  { id: 'deteriorating', label: 'Deteriorating',  color: '#C81E1E', bg: '#FDF2F2', border: '#FBD5D5' },
  { id: 'deceased',      label: 'Deceased',       color: '#374151', bg: '#F9FAFB', border: '#D1D5DB' },
];

interface ConfirmModalProps {
  referral: DemoReferral;
  onConfirm: (details: { seenAt: string; confirmSource: string; outcome: string; nextFollowUp?: string }) => void;
  onDismiss: () => void;
}

function ConfirmModal({ referral, onConfirm, onDismiss }: ConfirmModalProps) {
  const [seenDate, setSeenDate] = useState(new Date());
  const [showSeenPicker, setShowSeenPicker] = useState(false);
  const [confirmSource, setConfirmSource] = useState('');
  const [outcome, setOutcome] = useState('');
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
  const [noFollowUp, setNoFollowUp] = useState(false);

  const canConfirm = confirmSource !== '' && outcome !== '';

  function formatDate(d: Date): string {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function handleConfirm() {
    onConfirm({
      seenAt: formatDate(seenDate),
      confirmSource,
      outcome,
      nextFollowUp: noFollowUp || !followUpDate ? undefined : followUpDate.toISOString().slice(0, 10),
    });
  }

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={modalStyles.backdrop} onPress={onDismiss} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.handle} />

        {/* Header */}
        <View style={modalStyles.header}>
          <View>
            <Text style={modalStyles.headerTitle}>Confirm referral seen</Text>
            <Text style={modalStyles.headerSub}>{referral.name}</Text>
          </View>
          <Pressable onPress={onDismiss} style={modalStyles.closeBtn} accessibilityLabel="Close">
            <X size={20} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView
          style={modalStyles.body}
          contentContainerStyle={modalStyles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Confirmation date ── */}
          <Text style={modalStyles.sectionLabel}>DATE SEEN</Text>
          {Platform.OS !== 'ios' && (
            <Pressable
              style={modalStyles.dateBtn}
              onPress={() => setShowSeenPicker(true)}
              accessibilityRole="button"
            >
              <CalendarDays size={16} color="#6B7280" />
              <Text style={modalStyles.dateBtnText}>{formatDate(seenDate)}</Text>
            </Pressable>
          )}
          {(showSeenPicker || Platform.OS === 'ios') && (
            <DateTimePicker
              value={seenDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onValueChange={(_, date) => {
                setShowSeenPicker(false);
                if (date) setSeenDate(date);
              }}
              onDismiss={() => setShowSeenPicker(false)}
            />
          )}

          {/* ── How confirmed ── */}
          <Text style={[modalStyles.sectionLabel, { marginTop: 18 }]}>HOW WAS THIS CONFIRMED?</Text>
          <View style={modalStyles.chipGrid}>
            {CONFIRM_SOURCES.map((s) => {
              const sel = confirmSource === s.id;
              return (
                <Pressable
                  key={s.id}
                  style={[modalStyles.chip, sel && modalStyles.chipActive]}
                  onPress={() => setConfirmSource(sel ? '' : s.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: sel }}
                >
                  {sel && <Check size={12} color="#FF5A00" style={{ marginRight: 4 }} />}
                  <Text style={[modalStyles.chipText, sel && modalStyles.chipTextActive]}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Outcome ── */}
          <Text style={[modalStyles.sectionLabel, { marginTop: 18 }]}>OUTCOME</Text>
          <View style={modalStyles.outcomeRow}>
            {OUTCOMES.map((o) => {
              const sel = outcome === o.id;
              return (
                <Pressable
                  key={o.id}
                  style={[
                    modalStyles.outcomeBtn,
                    { borderColor: sel ? o.color : '#E5E7EB', backgroundColor: sel ? o.bg : '#FDFDFD' },
                  ]}
                  onPress={() => setOutcome(sel ? '' : o.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: sel }}
                >
                  <Text style={[modalStyles.outcomeBtnText, { color: sel ? o.color : '#6B7280' }]}>
                    {o.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Next follow-up ── */}
          <Text style={[modalStyles.sectionLabel, { marginTop: 18 }]}>NEXT FOLLOW-UP DATE</Text>
          <Pressable
            style={[modalStyles.chip, noFollowUp && modalStyles.chipActive, { alignSelf: 'flex-start', marginBottom: 10 }]}
            onPress={() => { setNoFollowUp((v) => !v); setFollowUpDate(null); }}
          >
            {noFollowUp && <Check size={12} color="#FF5A00" style={{ marginRight: 4 }} />}
            <Text style={[modalStyles.chipText, noFollowUp && modalStyles.chipTextActive]}>
              No follow-up needed
            </Text>
          </Pressable>

          {!noFollowUp && (
            <>
              {Platform.OS !== 'ios' && (
                <Pressable
                  style={modalStyles.dateBtn}
                  onPress={() => setShowFollowUpPicker(true)}
                  accessibilityRole="button"
                >
                  <CalendarDays size={16} color="#6B7280" />
                  <Text style={[modalStyles.dateBtnText, !followUpDate && { color: '#9CA3AF' }]}>
                    {followUpDate ? formatDate(followUpDate) : 'Select date…'}
                  </Text>
                </Pressable>
              )}
              {(showFollowUpPicker || Platform.OS === 'ios') && (
                <DateTimePicker
                  value={followUpDate ?? new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onValueChange={(_, date) => {
                    setShowFollowUpPicker(false);
                    if (date) setFollowUpDate(date);
                  }}
                  onDismiss={() => setShowFollowUpPicker(false)}
                />
              )}
            </>
          )}

          {/* Spacer for buttons */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Footer buttons */}
        <View style={modalStyles.footer}>
          <Pressable style={modalStyles.cancelBtn} onPress={onDismiss} accessibilityRole="button">
            <Text style={modalStyles.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[modalStyles.confirmBtn, !canConfirm && modalStyles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!canConfirm}
            accessibilityRole="button"
          >
            <Check size={15} color="#FDFDFD" strokeWidth={3} />
            <Text style={modalStyles.confirmBtnText}>Confirm seen</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#FDFDFD',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F3',
  },
  headerTitle: { fontSize: 16, fontFamily: fonts.bold, fontWeight: '700', color: '#08283B' },
  headerSub: { fontSize: 13, fontFamily: fonts.regular, color: '#6B7280', marginTop: 2 },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 16 },

  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F4F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  dateBtnText: { fontSize: 14, fontFamily: fonts.semiBold, fontWeight: '600', color: '#08283B' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  chipActive: {
    borderColor: '#FF5A00',
    backgroundColor: 'rgba(255,90,0,0.06)',
  },
  chipText: { fontSize: 13, fontFamily: fonts.medium, color: '#6B7280', fontWeight: '500' },
  chipTextActive: { color: '#FF5A00', fontWeight: '600' },

  outcomeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  outcomeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
  },
  outcomeBtnText: { fontSize: 13, fontFamily: fonts.semiBold, fontWeight: '600' },

  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: '#FDFDFD',
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontFamily: fonts.semiBold, fontWeight: '600', color: '#374151' },
  confirmBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#057A55',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: '#FDFDFD' },
});

// ─── Referral card ────────────────────────────────────────────────────────────

function ReferralCard({
  referral,
  onConfirmPress,
}: {
  referral: DemoReferral;
  onConfirmPress: () => void;
}) {
  const av = avatarStyle(referral.type);
  const ins = initials(referral.name);
  const isIssued = referral.status === 'issued';
  const isSeen = referral.status === 'seen';

  const outcomeStyle = OUTCOMES.find((o) => o.id === referral.outcome);

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: av.bg }]}>
          <Text style={[styles.avatarText, { color: av.fg }]}>{ins}</Text>
        </View>
        <View style={styles.cardTopMid}>
          <Text style={styles.clientName}>{referral.name}</Text>
          <Text style={styles.facilityText}>{referral.facility}</Text>
        </View>
        <View style={[styles.statusBadge, isIssued ? { backgroundColor: '#FFEFE6' } : { backgroundColor: '#F3FAF7' }]}>
          <Text style={[styles.statusBadgeText, isIssued ? { color: '#B54000' } : { color: '#057A55' }]}>
            {isIssued ? 'AWAITING' : 'SEEN'}
          </Text>
        </View>
      </View>

      {/* Reason */}
      <View style={styles.reasonBox}>
        <Text style={styles.reasonText}>{referral.reason}</Text>
      </View>

      {/* Due / seen strip */}
      {isIssued && referral.due && (
        <View style={styles.stripIssued}>
          <Clock size={14} color="#B48700" />
          <Text style={styles.stripTextIssued}>Due {referral.due}</Text>
        </View>
      )}
      {isSeen && referral.seenAt && (
        <View style={styles.stripSeen}>
          <Check size={14} color="#057A55" strokeWidth={3} />
          <Text style={styles.stripTextSeen}>Seen · {referral.seenAt}</Text>
          {referral.confirmSource && (
            <Text style={styles.stripTextSeenSub}>
              {' · '}{CONFIRM_SOURCES.find((s) => s.id === referral.confirmSource)?.label}
            </Text>
          )}
        </View>
      )}

      {/* Outcome badge on confirmed cards */}
      {isSeen && outcomeStyle && (
        <View style={[styles.outcomePill, { backgroundColor: outcomeStyle.bg, borderColor: outcomeStyle.border }]}>
          <Text style={[styles.outcomePillText, { color: outcomeStyle.color }]}>
            {outcomeStyle.label}
          </Text>
        </View>
      )}

      {/* Next follow-up */}
      {isSeen && referral.nextFollowUp && (
        <View style={styles.followUpRow}>
          <CalendarDays size={13} color="#6B7280" />
          <Text style={styles.followUpText}>Next follow-up: {referral.nextFollowUp}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.issuedAt}>Issued {referral.at}</Text>
        {isIssued && (
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.callBtn}
              accessibilityRole="button"
              accessibilityLabel="Call client"
              onPress={() => {
                if (referral.phone) {
                  Linking.openURL(`tel:${referral.phone}`);
                } else {
                  Alert.alert('No phone number', 'No phone number is recorded for this client.');
                }
              }}
            >
              <Phone size={14} color="#08283B" />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={onConfirmPress}
              accessibilityRole="button"
              accessibilityLabel="Confirm client was seen"
            >
              <Text style={styles.confirmBtnText}>Confirm seen</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ReferralsListScreen({ navigation }: Props) {
  const { referrals, confirmReferralSeen } = useAppStore();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const issuedCount = referrals.filter((r) => r.status === 'issued').length;
  const seenCount   = referrals.filter((r) => r.status === 'seen').length;

  const confirmingReferral = referrals.find((r) => r.id === confirmingId);

  function handleConfirm(details: { seenAt: string; confirmSource: string; outcome: string; nextFollowUp?: string }) {
    if (!confirmingReferral) return;
    confirmReferralSeen(confirmingReferral.clientId, details);
    setConfirmingId(null);
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
            <ChevronLeft size={24} color="#FDFDFD" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Referrals</Text>
            <Text style={styles.headerSub}>Post-referral follow-up</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {referrals.length > 0 ? (
          <>
            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#FFF9E6', borderColor: '#FFE18A' }]}>
                <Text style={[styles.statCount, { color: '#B48700' }]}>{issuedCount}</Text>
                <Text style={[styles.statLabel, { color: '#8C6900' }]}>Awaiting confirmation</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#F3FAF7', borderColor: '#BCF0DA' }]}>
                <Text style={[styles.statCount, { color: '#057A55' }]}>{seenCount}</Text>
                <Text style={[styles.statLabel, { color: '#046C4E' }]}>Seen at facility</Text>
              </View>
            </View>
            <Text style={styles.statsNote}>
              Track each severe case until the client is confirmed seen
            </Text>

            {referrals.map((r) => (
              <ReferralCard
                key={r.id}
                referral={r}
                onConfirmPress={() => setConfirmingId(r.id)}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Shield size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No open referrals</Text>
            <Text style={styles.emptyBody}>
              Severe cases referred to a health facility will appear here for follow-up.
            </Text>
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      <BottomTabBar
        active="referrals"
        onHome={() => navigation.navigate('Home')}
        onReferrals={() => {}}
        onSync={() => navigation.navigate('Sync')}
        onProfile={() => navigation.navigate('Settings')}
        referralBadge={issuedCount}
      />

      {/* Confirm seen modal */}
      {confirmingReferral && (
        <ConfirmModal
          referral={confirmingReferral}
          onConfirm={handleConfirm}
          onDismiss={() => setConfirmingId(null)}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F4F5' },
  headerSafe: { backgroundColor: '#08283B' },
  header: {
    backgroundColor: '#08283B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontFamily: fonts.bold, fontWeight: '700', color: '#FFFFFF' },
  headerSub: { fontSize: 12, fontFamily: fonts.regular, color: '#92C9F9', marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statCount: { fontSize: 22, fontFamily: fonts.bold, fontWeight: '700', marginBottom: 3 },
  statLabel: { fontSize: 12, fontFamily: fonts.medium, fontWeight: '500', textAlign: 'center' },
  statsNote: { fontSize: 12, fontFamily: fonts.regular, color: '#9CA3AF', textAlign: 'center', marginBottom: 18, lineHeight: 16 },

  card: {
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 14, fontFamily: fonts.bold, fontWeight: '700' },
  cardTopMid: { flex: 1 },
  clientName: { fontSize: 15, fontFamily: fonts.bold, fontWeight: '700', color: '#08283B', marginBottom: 2 },
  facilityText: { fontSize: 12, fontFamily: fonts.regular, color: '#6B7280' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, flexShrink: 0 },
  statusBadgeText: { fontSize: 10, fontFamily: fonts.bold, fontWeight: '700', letterSpacing: 0.4 },

  reasonBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  reasonText: { fontSize: 12, fontFamily: fonts.regular, color: '#374151', lineHeight: 18 },

  stripIssued: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#FFF9E6', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 11, marginBottom: 10,
  },
  stripSeen: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#F3FAF7', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 11, marginBottom: 8,
    flexWrap: 'wrap',
  },
  stripTextIssued: { fontSize: 12, fontFamily: fonts.semiBold, color: '#8C6900', fontWeight: '600' },
  stripTextSeen: { fontSize: 12, fontFamily: fonts.semiBold, color: '#057A55', fontWeight: '600' },
  stripTextSeenSub: { fontSize: 12, fontFamily: fonts.regular, color: '#6B7280' },

  outcomePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  outcomePillText: { fontSize: 12, fontFamily: fonts.bold, fontWeight: '700' },

  followUpRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 8,
  },
  followUpText: { fontSize: 12, fontFamily: fonts.regular, color: '#6B7280' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  issuedAt: { fontSize: 11, fontFamily: fonts.regular, color: '#9CA3AF', flex: 1 },
  footerActions: { flexDirection: 'row', gap: 8 },
  callBtn: {
    backgroundColor: '#F2F4F5', borderRadius: 9,
    paddingVertical: 8, paddingHorizontal: 13,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  callBtnText: { fontSize: 13, fontFamily: fonts.semiBold, fontWeight: '600', color: '#08283B' },
  confirmBtn: {
    backgroundColor: '#057A55', borderRadius: 9,
    paddingVertical: 8, paddingHorizontal: 13,
  },
  confirmBtnText: { fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: '#FFFFFF' },

  emptyState: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontFamily: fonts.bold, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyBody: { fontSize: 14, fontFamily: fonts.regular, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
