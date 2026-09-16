import React, { useEffect, useRef } from 'react';
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
import { useAppStore, PLANS } from '../store';
import { ChevronLeft, Check, Volume2, Bluetooth, MessageCircle, Square, Mic } from 'lucide-react-native';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Voice'>;

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
  warningBorder:   '#FFE18A',
  warningDark:     '#8C6900',
  error:           '#C81E1E',
};

// ─── Waveform heights (40 bars, pseudo-random fixed pattern) ─────────────────
const WAVE_HEIGHTS = [
  8, 18, 32, 22, 14, 28, 40, 24, 12, 36,
  20, 30, 16, 38, 10, 26, 34, 18, 28, 40,
  14, 22, 36, 8,  30, 20, 12, 38, 24, 16,
  32, 10, 28, 18, 40, 22, 14, 30, 8,  26,
];
const TOTAL_BARS = WAVE_HEIGHTS.length;
const AUDIO_DURATION = 38; // seconds

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Delivery option card ─────────────────────────────────────────────────────
function DeliveryCard({
  iconBg,
  icon,
  title,
  sub,
  badge,
  badgeColor,
  badgeBg,
}: {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
}) {
  return (
    <View style={styles.deliveryCard}>
      <View style={[styles.deliveryIconBox, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1, marginBottom: 2 }}>{title}</Text>
        <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: C.fg3, lineHeight: 17 }}>{sub}</Text>
      </View>
      {badge && (
        <View style={{ backgroundColor: badgeBg ?? C.successBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 11, fontFamily: fonts.bold, fontWeight: '700', color: badgeColor ?? C.success }}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function VoiceScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const store = useAppStore();
  const client = store.clients.find((c) => c.id === clientId);

  const {
    voiceLang,
    audioPlaying,
    audioT,
    recording,
    recorded,
    recordT,
    offline,
  } = store;

  // Audio playback simulation
  const audioRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (audioPlaying) {
      audioRef.current = setInterval(() => {
        const next = store.audioT + 1;
        if (next >= AUDIO_DURATION) {
          store.setAudioPlaying(false);
          store.setAudioT(AUDIO_DURATION);
          if (audioRef.current) clearInterval(audioRef.current);
        } else {
          store.setAudioT(next);
        }
      }, 1000);
    } else {
      if (audioRef.current) clearInterval(audioRef.current);
    }
    return () => {
      if (audioRef.current) clearInterval(audioRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioPlaying]);

  // Recording simulation
  const recordRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (recording) {
      recordRef.current = setInterval(() => {
        store.setRecordT(store.recordT + 1);
      }, 1000);
    } else {
      if (recordRef.current) clearInterval(recordRef.current);
    }
    return () => {
      if (recordRef.current) clearInterval(recordRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  if (!client) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: C.fg4 }}>Client not found.</Text>
      </View>
    );
  }

  const plan = PLANS[clientId];
  const isAiPlan = clientId === 'amina' || clientId === 'rahim';
  const isDag = voiceLang === 'dag';

  const transcript = plan
    ? (isDag ? plan.voiceDag : plan.voiceEn)
    : (isDag
        ? 'Dasiba. Labmi na ti nya alaafee kariti.'
        : 'Good morning. Please follow the feeding plan provided and return for your next visit.');

  const barsPlayed = Math.floor((audioT / AUDIO_DURATION) * TOTAL_BARS);
  const progressPct = (audioT / AUDIO_DURATION) * 100;

  function handleRecordToggle() {
    if (recording) {
      store.setRecording(false);
      store.setRecorded(true);
    } else {
      store.setRecordT(0);
      store.setRecorded(false);
      store.setRecording(true);
    }
  }

  function handleDeliver() {
    store.setAudioPlaying(false);
    store.setAudioT(0);
    store.setRecording(false);
    store.setRecorded(false);
    store.setRecordT(0);
    navigation.navigate('Client', { clientId });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.primary }}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Go back">
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginTop: 4 }}>
          <Text style={styles.headerTitle}>Voice note</Text>
          <Text style={styles.headerSub}>For {client.caregiver}</Text>
        </View>
        {/* Language toggle */}
        <View style={styles.langToggle}>
          <TouchableOpacity
            style={[styles.langPill, !isDag && styles.langPillActive]}
            onPress={() => store.setVoiceLang('en')}
            accessibilityLabel="English"
          >
            <Text style={[styles.langPillText, !isDag && styles.langPillTextActive]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langPill, isDag && styles.langPillActive]}
            onPress={() => store.setVoiceLang('dag')}
            accessibilityLabel="Dagbani"
          >
            <Text style={[styles.langPillText, isDag && styles.langPillTextActive]}>Dagbani</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      >
        {/* Plan approved badge */}
        <View style={[styles.approvedBadge]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Check size={13} color={C.success} strokeWidth={3} />
            <Text style={{ fontSize: 13, fontFamily: fonts.semiBold, fontWeight: '600', color: C.success }}>Plan approved by you</Text>
          </View>
        </View>

        {/* ── Audio player card ── */}
        <View style={styles.playerCard}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1 }}>
              {isDag ? 'Dagbani' : 'EN'} counselling note
            </Text>
            {isAiPlan ? (
              <View style={{ backgroundColor: C.successBg, borderWidth: 1, borderColor: C.successBorder, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, fontFamily: fonts.bold, fontWeight: '700', color: C.success }}>AI enriched</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: C.lb50, borderWidth: 1, borderColor: C.lb200, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, fontFamily: fonts.bold, fontWeight: '700', color: C.lb700 }}>Deterministic</Text>
              </View>
            )}
          </View>

          {/* Waveform */}
          <View style={styles.waveform}>
            {WAVE_HEIGHTS.map((h, i) => (
              <View
                key={i}
                style={{
                  width: 5,
                  height: h,
                  borderRadius: 3,
                  backgroundColor: i < barsPlayed ? C.accent : '#ECECEB',
                }}
              />
            ))}
          </View>

          {/* Controls */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 }}>
            {/* Play/pause button */}
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => {
                if (audioT >= AUDIO_DURATION) store.setAudioT(0);
                store.setAudioPlaying(!audioPlaying);
              }}
              accessibilityLabel={audioPlaying ? 'Pause' : 'Play'}
            >
              <Text style={{ color: '#fff', fontSize: 20, fontFamily: fonts.regular }}>{audioPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              {/* Progress bar */}
              <View style={{ height: 5, backgroundColor: '#ECECEB', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                <View style={{ width: `${progressPct}%`, height: '100%', backgroundColor: C.accent, borderRadius: 3 }} />
              </View>
              {/* Time */}
              <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: C.fg4 }}>
                {formatTime(audioT)} / {formatTime(AUDIO_DURATION)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Transcript ── */}
        <Text style={styles.eyebrow}>TRANSCRIPT</Text>
        <View style={styles.transcriptCard}>
          <Text style={{ fontSize: 14, fontFamily: fonts.regular, color: C.fg2, lineHeight: 22 }}>{transcript}</Text>
        </View>
        {isDag && (
          <View style={[styles.warningBanner]}>
            <Text style={{ fontSize: 13, fontFamily: fonts.medium, color: C.warningDark, fontWeight: '500' }}>
              Draft translation · pending native-speaker review
            </Text>
          </View>
        )}

        {/* ── Give to caregiver ── */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Give it to the caregiver</Text>

        <DeliveryCard
          iconBg={C.lb50}
          icon={<Volume2 size={20} color={C.lb700} />}
          title="Play aloud now"
          sub="During counselling — no phone needed"
        />
        <DeliveryCard
          iconBg="#F6F5FF"
          icon={<Bluetooth size={20} color="#6C2BD9" />}
          title="Bluetooth to feature phone"
          sub="Works fully offline · for basic phones"
          badge="OFFLINE"
          badgeColor={C.success}
          badgeBg={C.successBg}
        />
        {offline ? (
          <DeliveryCard
            iconBg={C.successBg}
            icon={<MessageCircle size={20} color={C.success} />}
            title="Send via WhatsApp"
            sub="Needs a connection — will send when online"
            badge="QUEUED"
            badgeColor={C.warning}
            badgeBg={C.warningBg}
          />
        ) : (
          <DeliveryCard
            iconBg={C.successBg}
            icon={<MessageCircle size={20} color={C.success} />}
            title="Share via WhatsApp"
            sub=""
            badge="ONLINE"
            badgeColor={C.success}
            badgeBg={C.successBg}
          />
        )}

        {/* ── Record yourself ── */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Or record it yourself</Text>
        <View style={styles.recorderCard}>
          <TouchableOpacity
            style={[styles.recordBtn, { backgroundColor: recording ? C.error : C.primary }]}
            onPress={handleRecordToggle}
            accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
          >
            {recording
              ? <Square size={22} color="#FFFFFF" />
              : <Mic size={22} color="#FFFFFF" />}
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: C.fg1 }}>
                {recording ? 'Recording…' : 'Record in your own words'}
              </Text>
              {recorded && (
                <View style={{ backgroundColor: C.successBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 11, fontFamily: fonts.bold, fontWeight: '700', color: C.success }}>READY</Text>
                </View>
              )}
            </View>
            {recording ? (
              <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: C.error, marginTop: 3 }}>{formatTime(recordT)}</Text>
            ) : (
              <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: C.fg4, marginTop: 3 }}>
                {recorded ? 'Tap to re-record' : 'Tap to start · up to 2 minutes'}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Deliver button ── */}
      <View style={styles.deliverBar}>
        <TouchableOpacity
          style={styles.deliverBtn}
          onPress={handleDeliver}
          accessibilityLabel="Mark as delivered"
        >
          <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.bold, fontWeight: '700' }}>Mark as delivered</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  langToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 17,
  },
  langPillActive: {
    backgroundColor: '#fff',
  },
  langPillText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  langPillTextActive: {
    color: C.primary,
  },
  body: {
    flex: 1,
    backgroundColor: C.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -8,
  },
  approvedBadge: {
    backgroundColor: C.successBg,
    borderWidth: 1,
    borderColor: C.successBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  playerCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 20,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 16,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 44,
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: C.fg4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  transcriptCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    padding: 16,
    marginBottom: 8,
  },
  warningBanner: {
    backgroundColor: C.warningBg,
    borderWidth: 1,
    borderColor: C.warningBorder,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: C.fg1,
    marginBottom: 10,
  },
  deliveryCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  deliveryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recorderCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  recordBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deliverBar: {
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
  deliverBtn: {
    backgroundColor: C.success,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
});
