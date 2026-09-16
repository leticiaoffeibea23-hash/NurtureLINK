import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../App';
import { useAppStore, UiLang, displayName, ProfileEditable } from '../store';
import { BottomTabBar } from '../components/BottomTabBar';
import {
  ChevronLeft, BarChart2, BatteryMedium, HardDrive, Zap, TrendingUp,
  LayoutGrid, ChevronRight, Pencil, X, Check, Camera,
} from 'lucide-react-native';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const {
    battery,
    storageUsed,
    adaptiveSync,
    telemetryCount,
    uiLang,
    referrals,
    toggleAdaptive,
    setUiLang,
    logout,
    currentUser,
    refreshDeviceStats,
    updateProfile,
  } = useAppStore();

  useEffect(() => { refreshDeviceStats(); }, []);

  const issuedCount = referrals.filter((r) => r.status === 'issued').length;
  const storagePct = Math.min((storageUsed / 250) * 100, 100);

  // ── Edit mode state ──────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<ProfileEditable>({
    firstName: currentUser?.firstName ?? '',
    lastName: currentUser?.lastName ?? '',
    otherNames: currentUser?.otherNames ?? '',
    phone: currentUser?.phone ?? '',
    avatarUri: currentUser?.avatarUri ?? null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileEditable, string>>>({});

  function enterEdit() {
    setForm({
      firstName: currentUser?.firstName ?? '',
      lastName: currentUser?.lastName ?? '',
      otherNames: currentUser?.otherNames ?? '',
      phone: currentUser?.phone ?? '',
      avatarUri: currentUser?.avatarUri ?? null,
    });
    setErrors({});
    setEditMode(true);
  }

  function handleCancel() {
    const dirty =
      form.firstName !== (currentUser?.firstName ?? '') ||
      form.lastName !== (currentUser?.lastName ?? '') ||
      form.otherNames !== (currentUser?.otherNames ?? '') ||
      form.phone !== (currentUser?.phone ?? '') ||
      form.avatarUri !== (currentUser?.avatarUri ?? null);

    if (dirty) {
      Alert.alert('Discard changes?', 'Your edits will not be saved.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => setEditMode(false) },
      ]);
    } else {
      setEditMode(false);
    }
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (form.phone && !/^\+?[\d\s\-()]{7,15}$/.test(form.phone.trim())) {
      errs.phone = 'Enter a valid phone number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    updateProfile({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      otherNames: form.otherNames?.trim() || null,
      phone: form.phone.trim(),
      avatarUri: form.avatarUri,
    });
    setEditMode(false);
  }

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      if (editMode) {
        setForm((f) => ({ ...f, avatarUri: result.assets[0].uri }));
      } else {
        updateProfile({ avatarUri: result.assets[0].uri });
      }
    }
  }

  function handleSignOut() {
    logout();
    navigation.replace('Login');
  }

  // ── Avatar display helper ────────────────────────────────────────────────────
  const displayedAvatarUri = editMode ? form.avatarUri : currentUser?.avatarUri ?? null;
  const initials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : 'U';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {editMode ? (
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing"
              >
                <X size={22} color="#FDFDFD" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <ChevronLeft size={24} color="#FDFDFD" />
              </TouchableOpacity>
            )}

            <Text style={styles.headerTitle}>
              {editMode ? 'Edit profile' : 'Profile & device'}
            </Text>

            {editMode ? (
              <TouchableOpacity
                onPress={handleSave}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel="Save profile"
              >
                <Check size={22} color="#FDFDFD" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={enterEdit}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Pencil size={20} color="#FDFDFD" />
              </TouchableOpacity>
            )}
          </View>

          {/* Avatar + name */}
          <View style={styles.profileRow}>
            <TouchableOpacity
              onPress={handlePickAvatar}
              style={styles.avatarWrap}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
            >
              {displayedAvatarUri ? (
                <Image source={{ uri: displayedAvatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>{initials}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Camera size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              {editMode ? (
                <>
                  <View style={styles.nameRow}>
                    <View style={[styles.fieldWrap, { flex: 1 }]}>
                      <TextInput
                        style={[styles.nameInput, errors.firstName ? styles.inputError : undefined]}
                        value={form.firstName}
                        onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
                        placeholder="First name"
                        placeholderTextColor="#6B7280"
                        autoCapitalize="words"
                        accessibilityLabel="First name"
                      />
                      {errors.firstName ? (
                        <Text style={styles.errorText}>{errors.firstName}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.fieldWrap, { flex: 1 }]}>
                      <TextInput
                        style={[styles.nameInput, errors.lastName ? styles.inputError : undefined]}
                        value={form.lastName}
                        onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
                        placeholder="Last name"
                        placeholderTextColor="#6B7280"
                        autoCapitalize="words"
                        accessibilityLabel="Last name"
                      />
                      {errors.lastName ? (
                        <Text style={styles.errorText}>{errors.lastName}</Text>
                      ) : null}
                    </View>
                  </View>
                  <TextInput
                    style={styles.otherNamesInput}
                    value={form.otherNames ?? ''}
                    onChangeText={(v) => setForm((f) => ({ ...f, otherNames: v }))}
                    placeholder="Other names (optional)"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="words"
                    accessibilityLabel="Other names"
                  />
                </>
              ) : (
                <>
                  <Text style={styles.profileName}>
                    {currentUser ? displayName(currentUser) : 'Health Worker'}
                  </Text>
                  <Text style={styles.profileRole}>
                    {currentUser?.role === 'sup' ? 'Supervisor' : 'Community Health Officer'}
                    {currentUser?.facilityName ? ` · ${currentUser.facilityName}` : ''}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* PROFILE section (edit mode only) */}
        {editMode && (
          <>
            <Text style={styles.sectionLabel}>CONTACT</Text>
            <View style={styles.card}>
              <View style={styles.settingRow}>
                <View style={[styles.settingBody, { paddingVertical: 4 }]}>
                  <Text style={styles.fieldLabel}>Phone number</Text>
                  <TextInput
                    style={[styles.inlineInput, errors.phone ? styles.inputError : undefined]}
                    value={form.phone}
                    onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                    placeholder="+233 XX XXX XXXX"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    accessibilityLabel="Phone number"
                  />
                  {errors.phone ? (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          </>
        )}

        {/* Account info (view mode) */}
        {!editMode && (
          <>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <View style={styles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingBody}>
                  <Text style={styles.settingTitle}>Phone</Text>
                  <Text style={styles.settingDesc}>{currentUser?.phone || '—'}</Text>
                </View>
              </View>
              {(currentUser?.facilityDistrict || currentUser?.facilityRegion) && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.settingRow}>
                    <View style={styles.settingBody}>
                      <Text style={styles.settingTitle}>District</Text>
                      <Text style={styles.settingDesc}>
                        {[currentUser.facilityDistrict, currentUser.facilityRegion]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </>
        )}

        {/* THIS DEVICE section */}
        <Text style={styles.sectionLabel}>THIS DEVICE</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <BatteryMedium size={20} color="#374151" />
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Battery {battery}%</Text>
              <Text style={styles.settingDesc}>Heavy syncs pause below 30% unless on power</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <HardDrive size={20} color="#374151" />
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Storage · {storageUsed} MB of 250 MB</Text>
              <View style={styles.storageBar}>
                <View style={[styles.storageBarFill, { width: `${storagePct}%` }]} />
              </View>
              <Text style={styles.settingDesc}>Old audio clears automatically under 10% free</Text>
            </View>
          </View>
        </View>

        {/* SYNC & DATA section */}
        <Text style={styles.sectionLabel}>SYNC & DATA</Text>
        <View style={styles.card}>
          <View style={styles.settingRowSpaced}>
            <Zap size={20} color="#374151" />
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Battery-aware sync</Text>
              <Text style={styles.settingDesc}>Large downloads only on power or Wi-Fi</Text>
            </View>
            <Switch
              value={adaptiveSync}
              onValueChange={toggleAdaptive}
              trackColor={{ false: '#E5E7EB', true: '#427CAF' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle battery-aware sync"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <BarChart2 size={20} color="#374151" />
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Telemetry queue · {telemetryCount} events</Text>
              <Text style={styles.settingDesc}>Anonymised usage, PII stripped, sent with sync</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.settingRowSpaced}
            onPress={() => navigation.navigate('Tally')}
            accessibilityRole="button"
            accessibilityLabel="Monthly tally"
          >
            <TrendingUp size={20} color="#374151" />
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Monthly tally · DHIMS2</Text>
              <Text style={styles.settingDesc}>Auto-generated CHPS report</Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* INTERFACE LANGUAGE section */}
        <Text style={styles.sectionLabel}>INTERFACE LANGUAGE</Text>
        <View style={[styles.card, { gap: 12 }]}>
          <View style={styles.langToggleRow}>
            {(['en', 'dag'] as UiLang[]).map((lang) => {
              const isActive = uiLang === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.langBtn,
                    isActive ? styles.langBtnActive : styles.langBtnInactive,
                  ]}
                  onPress={() => setUiLang(lang)}
                  accessibilityRole="button"
                  accessibilityLabel={lang === 'en' ? 'English' : 'Dagbani'}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.langBtnText, isActive ? styles.langBtnTextActive : styles.langBtnTextInactive]}>
                    {lang === 'en' ? 'English' : 'Dagbani'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.betaRow}>
            <View style={styles.betaBadge}>
              <Text style={styles.betaBadgeText}>Beta</Text>
            </View>
            <Text style={styles.betaNote}>Interface translation is under native-speaker review</Text>
          </View>
        </View>

        {/* District overview */}
        <TouchableOpacity
          style={styles.districtCard}
          onPress={() => navigation.navigate('Supervisor')}
          accessibilityRole="button"
          accessibilityLabel="District overview"
        >
          <LayoutGrid size={20} color="#374151" />
          <View style={styles.settingBody}>
            <Text style={styles.settingTitle}>District overview</Text>
            <Text style={styles.settingDesc}>
              {[currentUser?.facilityDistrict, currentUser?.facilityRegion].filter(Boolean).join(' · ') || 'No district assigned'}
            </Text>
          </View>
          <ChevronRight size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />
      </ScrollView>

      <BottomTabBar
        active="profile"
        onHome={() => navigation.navigate('Home')}
        onReferrals={() => navigation.navigate('ReferralsList')}
        onSync={() => navigation.navigate('Sync')}
        onProfile={() => {}}
        referralBadge={issuedCount}
      />
    </KeyboardAvoidingView>
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
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },

  // Avatar
  avatarWrap: {
    position: 'relative',
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#427CAF',
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#427CAF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#08283B',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // View mode name/role
  profileName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#92C9F9',
  },

  // Edit mode name inputs (inline in header)
  nameRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldWrap: {
    gap: 2,
  },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  otherNamesInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#FFFFFF',
    marginTop: 4,
  },
  inputError: {
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#FCA5A5',
    marginTop: 2,
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
    marginVertical: 0,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
    gap: 12,
  },
  settingRowSpaced: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  settingBody: {
    flex: 1,
    gap: 3,
  },
  settingTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#08283B',
  },
  settingDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#6B7280',
    lineHeight: 16,
  },

  // Inline card input (phone)
  fieldLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#08283B',
    backgroundColor: '#F9FAFB',
  },

  // Storage bar
  storageBar: {
    height: 7,
    backgroundColor: '#ECECEB',
    borderRadius: 4,
    marginVertical: 6,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: '#427CAF',
    borderRadius: 4,
  },

  // Language toggle
  langToggleRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 13,
    paddingBottom: 0,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  langBtnActive: {
    backgroundColor: '#08283B',
    borderColor: '#08283B',
  },
  langBtnInactive: {
    backgroundColor: '#FDFDFD',
    borderColor: '#E5E7EB',
  },
  langBtnText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  langBtnTextActive: {
    color: '#FFFFFF',
  },
  langBtnTextInactive: {
    color: '#374151',
  },

  betaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 13,
  },
  betaBadge: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFE18A',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  betaBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#8C6900',
  },
  betaNote: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#8C6900',
    flex: 1,
    lineHeight: 15,
  },

  // District card
  districtCard: {
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },

  // Sign out
  signOutBtn: {
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FBD5D5',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 8,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#C81E1E',
  },
});
