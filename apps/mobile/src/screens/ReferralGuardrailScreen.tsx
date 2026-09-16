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
import { useAppStore } from '../store';
import { ChevronLeft, AlertTriangle, Shield, Phone } from 'lucide-react-native';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ReferralGuardrail'>;

export function ReferralGuardrailScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const { clients, issueReferral } = useAppStore();
  const client = clients.find((c) => c.id === clientId);

  if (!client) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF2F2', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#C81E1E' }}>Client not found.</Text>
      </SafeAreaView>
    );
  }

  function handleIssueReferral() {
    issueReferral(clientId);
    navigation.navigate('Client', { clientId });
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
          <Text style={styles.headerTitle}>Referral required</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon + heading */}
        <View style={styles.iconSection}>
          <View style={styles.iconCircle}>
            <AlertTriangle size={32} color="#C81E1E" />
          </View>
          <Text style={styles.headingTitle}>Refer to a health facility now</Text>
          <Text style={styles.headingBody}>
            {client.name} shows a danger sign. Nutrition counselling is bypassed — this case needs clinical care.
          </Text>
        </View>

        {/* "Why this triggered" card */}
        <View style={styles.triggerCard}>
          <Text style={styles.eyebrow}>WHY THIS TRIGGERED</Text>
          <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{client.flagDetail}</Text>
          </View>
          <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>Below WHO/GHS threshold for severe wasting.</Text>
          </View>
        </View>

        {/* Nearest facility card */}
        <View style={styles.facilityCard}>
          <Text style={styles.facilityEyebrow}>NEAREST FACILITY</Text>
          <Text style={styles.facilityName}>Tamale West Hospital</Text>
          <Text style={styles.facilityMeta}>Nutrition rehabilitation unit · 14 km</Text>
        </View>

        {/* Follow-up note */}
        <View style={styles.followCard}>
          <Shield size={16} color="#C81E1E" />
          <Text style={styles.followText}>
            Issuing creates a referral record and a follow-up flag so this child isn't lost after referral.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Bottom action bar ── */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.callBtn}
          accessibilityRole="button"
          accessibilityLabel="Call facility"
        >
          <Phone size={16} color="#08283B" />
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.issueBtn}
          onPress={handleIssueReferral}
          accessibilityRole="button"
          accessibilityLabel="Issue referral"
        >
          <Text style={styles.issueBtnText}>Issue referral</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FDF2F2',
  },
  headerSafe: {
    backgroundColor: '#9B1C1C',
  },
  header: {
    backgroundColor: '#9B1C1C',
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

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 20,
  },

  // Icon + heading
  iconSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FDE8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headingTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#9B1C1C',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 26,
  },
  headingBody: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#374151',
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 20,
  },

  // Trigger card
  triggerCard: {
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#FBD5D5',
    borderRadius: 15,
    padding: 15,
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#C81E1E',
    letterSpacing: 0.7,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  bulletDot: {
    width: 9,
    height: 9,
    borderRadius: 4,
    backgroundColor: '#C81E1E',
    marginTop: 4,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#374151',
    flex: 1,
    lineHeight: 19,
  },

  // Facility card
  facilityCard: {
    backgroundColor: '#08283B',
    borderRadius: 15,
    padding: 16,
    marginBottom: 14,
  },
  facilityEyebrow: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#92C9F9',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  facilityName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  facilityMeta: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#8D9CA5',
  },

  // Follow-up note
  followCard: {
    backgroundColor: '#F3FAF7',
    borderWidth: 1,
    borderColor: '#BCF0DA',
    borderRadius: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  followText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#08283B',
    flex: 1,
    lineHeight: 18,
  },

  // Action bar
  actionBar: {
    backgroundColor: '#FDFDFD',
    borderTopWidth: 1,
    borderTopColor: '#FBD5D5',
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 30,
  },
  callBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#C81E1E',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  callBtnText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#C81E1E',
  },
  issueBtn: {
    flex: 1.4,
    backgroundColor: '#C81E1E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  issueBtnText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
