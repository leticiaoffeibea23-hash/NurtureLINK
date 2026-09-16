import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ChevronLeft,
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  Building2,
  MapPin,
  ChevronDown,
  Check,
  X,
  Search,
} from 'lucide-react-native';

import { RootStackParamList } from '../../App';
import { LogoMark } from '../assets/LogoMark';
import { fonts } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8181';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;
type AppRole = 'CHO' | 'supervisor';

interface Facility {
  id: string;
  name: string;
  district: string;
  region: string;
}

const ROLES: { value: AppRole; label: string; sub: string }[] = [
  { value: 'CHO', label: 'Community Health Officer', sub: 'Records visits and manages caseload' },
  { value: 'supervisor', label: 'Supervisor', sub: 'Oversees CHOs across the district' },
];

// ── Dark-themed picker modal ────────────────────────────────────────────────

interface PickerItem { label: string; sublabel?: string; value: string }

interface DarkPickerModalProps {
  visible: boolean;
  title: string;
  items: PickerItem[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  onDismiss: () => void;
  searchable?: boolean;
}

function DarkPickerModal({
  visible,
  title,
  items,
  selectedValue,
  onSelect,
  onDismiss,
  searchable = false,
}: DarkPickerModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.sublabel ?? '').toLowerCase().includes(q),
    );
  }, [items, query]);

  function handleSelect(value: string) {
    onSelect(value);
    setQuery('');
    onDismiss();
  }

  function handleDismiss() {
    setQuery('');
    onDismiss();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <View style={pickerStyles.overlay}>
        <Pressable style={pickerStyles.backdrop} onPress={handleDismiss} />
        <View style={pickerStyles.sheet}>
        {/* Handle */}
        <View style={pickerStyles.handle} />

        {/* Header */}
        <View style={pickerStyles.sheetHeader}>
          <Text style={pickerStyles.sheetTitle}>{title}</Text>
          <Pressable onPress={handleDismiss} style={pickerStyles.closeBtn} accessibilityLabel="Close">
            <X size={20} color="#8D9CA5" />
          </Pressable>
        </View>

        {/* Search */}
        {searchable && (
          <View style={pickerStyles.searchRow}>
            <Search size={16} color="#5A6F7C" style={pickerStyles.searchIcon} />
            <TextInput
              style={pickerStyles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search…"
              placeholderTextColor="#5A6F7C"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} style={pickerStyles.searchClear}>
                <X size={14} color="#5A6F7C" />
              </Pressable>
            )}
          </View>
        )}

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.value}
          style={pickerStyles.list}
          contentContainerStyle={pickerStyles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const active = item.value === selectedValue;
            return (
              <Pressable
                style={[pickerStyles.listItem, active && pickerStyles.listItemActive]}
                onPress={() => handleSelect(item.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <View style={pickerStyles.listItemText}>
                  <Text style={[pickerStyles.listItemLabel, active && pickerStyles.listItemLabelActive]}>
                    {item.label}
                  </Text>
                  {item.sublabel ? (
                    <Text style={pickerStyles.listItemSub}>{item.sublabel}</Text>
                  ) : null}
                </View>
                {active && <Check size={16} color="#FF5A00" />}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={pickerStyles.emptyText}>No results</Text>
          }
        />
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#0E3550',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FDFDFD',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#FDFDFD',
    padding: 0,
  },
  searchClear: { padding: 4 },
  list: { flexGrow: 1, maxHeight: 320 },
  listContent: { paddingHorizontal: 12, paddingVertical: 4 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  listItemActive: {
    backgroundColor: 'rgba(255,90,0,0.12)',
  },
  listItemText: { flex: 1 },
  listItemLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: '#C2D0D9',
  },
  listItemLabelActive: { color: '#FDFDFD' },
  listItemSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#5A6F7C',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#5A6F7C',
    textAlign: 'center',
    paddingVertical: 24,
  },
});

// ── Cascading picker button ─────────────────────────────────────────────────

interface PickerButtonProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
}

function PickerButton({ icon, label, value, placeholder, onPress, disabled = false }: PickerButtonProps) {
  return (
    <View style={pkBtnStyles.group}>
      <Text style={pkBtnStyles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [
          pkBtnStyles.btn,
          disabled && pkBtnStyles.btnDisabled,
          pressed && !disabled && pkBtnStyles.btnPressed,
        ]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
      >
        <View style={pkBtnStyles.iconWrap}>{icon}</View>
        <Text
          style={[pkBtnStyles.valueText, !value && pkBtnStyles.placeholderText]}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>
        <ChevronDown size={16} color={disabled ? '#3A5068' : '#8D9CA5'} />
      </Pressable>
    </View>
  );
}

const pkBtnStyles = StyleSheet.create({
  group: { marginBottom: 10 },
  label: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#8D9CA5',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 14,
    height: 52,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnPressed: { opacity: 0.8 },
  iconWrap: { width: 20, alignItems: 'center' },
  valueText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#FDFDFD',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#5A6F7C',
    fontFamily: fonts.regular,
    fontWeight: '400',
  },
});

// ── Main screen ─────────────────────────────────────────────────────────────

export function SignUpScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState<AppRole>('CHO');

  // Cascading facility selection
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [facilityId, setFacilityId] = useState<string | null>(null);

  // Picker modal state
  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [facilityModalOpen, setFacilityModalOpen] = useState(false);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[SignUp] Fetching facilities from:', `${API_URL}/facilities`);
    fetch(`${API_URL}/facilities`)
      .then((r) => {
        console.log('[SignUp] Facilities response status:', r.status, r.ok);
        return r.json();
      })
      .then((data) => {
        console.log('[SignUp] Facilities data received:', JSON.stringify(data));
        setFacilities((data as { facilities: Facility[] }).facilities ?? []);
      })
      .catch((err) => {
        console.warn('[SignUp] Failed to load facilities:', err?.message ?? String(err));
        setError('Could not load facilities. Check your connection and try again.');
      })
      .finally(() => setFacilitiesLoading(false));
  }, []);

  // Derived picker data
  const regions = useMemo<PickerItem[]>(() => {
    const seen = new Set<string>();
    const out: PickerItem[] = [];
    for (const f of facilities) {
      if (f.region && !seen.has(f.region)) {
        seen.add(f.region);
        out.push({ label: f.region, value: f.region });
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label));
  }, [facilities]);

  const districts = useMemo<PickerItem[]>(() => {
    if (!selectedRegion) return [];
    const seen = new Set<string>();
    const out: PickerItem[] = [];
    for (const f of facilities) {
      if (f.region === selectedRegion && f.district && !seen.has(f.district)) {
        seen.add(f.district);
        out.push({ label: f.district, value: f.district });
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label));
  }, [facilities, selectedRegion]);

  const filteredFacilities = useMemo<PickerItem[]>(() => {
    if (!selectedRegion || !selectedDistrict) return [];
    return facilities
      .filter((f) => f.region === selectedRegion && f.district === selectedDistrict)
      .map((f) => ({ label: f.name, value: f.id, sublabel: f.district }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [facilities, selectedRegion, selectedDistrict]);

  const selectedFacilityName = useMemo(
    () => facilities.find((f) => f.id === facilityId)?.name ?? null,
    [facilities, facilityId],
  );

  function handleRegionSelect(region: string) {
    setSelectedRegion(region);
    setSelectedDistrict(null);
    setFacilityId(null);
  }

  function handleDistrictSelect(district: string) {
    setSelectedDistrict(district);
    setFacilityId(null);
  }

  function validate(): string | null {
    if (!firstName.trim()) return 'First name is required.';
    if (!lastName.trim()) return 'Last name is required.';
    if (!phone.trim() || phone.trim().length < 10) return 'Enter a valid phone number.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  }

  async function handleSignUp() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName:  firstName.trim(),
          lastName:   lastName.trim(),
          ...(otherNames.trim() ? { otherNames: otherNames.trim() } : {}),
          phone:      phone.trim(),
          password,
          role,
          ...(facilityId ? { facilityId } : {}),
        }),
      });

      if (res.status === 201 || res.status === 200) {
        navigation.replace('VerifyAccount', {
          mode: 'registration',
          phone: phone.trim(),
        });
      } else if (res.status === 409) {
        setError('An account with this phone number already exists.');
      } else {
        const body = await res.json().catch(() => ({})) as { message?: string };
        setError(body.message ?? 'Registration failed. Please try again.');
      }
    } catch {
      setError('No connection. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ChevronLeft size={24} color="#FDFDFD" />
          </Pressable>
          <View style={styles.logoBox}>
            <LogoMark size={18} onDark={false} />
          </View>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.headingSub}>Register to manage your caseload offline</Text>

        {/* Form */}
        <View style={styles.form}>
          {/* First name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>First name</Text>
            <View style={styles.inputRow}>
              <User size={18} color="#8D9CA5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={(v) => { setFirstName(v); setError(null); }}
                placeholder="Yakubu"
                placeholderTextColor="#5A6F7C"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Last name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Last name</Text>
            <View style={styles.inputRow}>
              <User size={18} color="#8D9CA5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={(v) => { setLastName(v); setError(null); }}
                placeholder="Lute"
                placeholderTextColor="#5A6F7C"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Other names */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Other names <Text style={styles.optionalTag}>(optional)</Text>
            </Text>
            <View style={styles.inputRow}>
              <User size={18} color="#8D9CA5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={otherNames}
                onChangeText={(v) => { setOtherNames(v); setError(null); }}
                placeholder="Middle name, etc."
                placeholderTextColor="#5A6F7C"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone number</Text>
            <View style={styles.inputRow}>
              <Phone size={18} color="#8D9CA5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(v) => { setPhone(v); setError(null); }}
                placeholder="+233 244 000 000"
                placeholderTextColor="#5A6F7C"
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color="#8D9CA5" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(null); }}
                placeholder="Min. 8 characters"
                placeholderTextColor="#5A6F7C"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword
                  ? <EyeOff size={18} color="#8D9CA5" />
                  : <Eye size={18} color="#8D9CA5" />}
              </Pressable>
            </View>
          </View>

          {/* Confirm password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm password</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color="#8D9CA5" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
                placeholder="Repeat your password"
                placeholderTextColor="#5A6F7C"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
              <Pressable
                onPress={() => setShowConfirm((v) => !v)}
                style={styles.eyeBtn}
                accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm
                  ? <EyeOff size={18} color="#8D9CA5" />
                  : <Eye size={18} color="#8D9CA5" />}
              </Pressable>
            </View>
          </View>

          {/* Role */}
          <View style={styles.fieldGroup}>
            <View style={styles.iconLabelRow}>
              <Briefcase size={15} color="#8D9CA5" />
              <Text style={styles.fieldLabel}>Role</Text>
            </View>
            <View style={styles.optionList}>
              {ROLES.map((r) => (
                <Pressable
                  key={r.value}
                  style={[styles.optionRow, role === r.value && styles.optionRowActive]}
                  onPress={() => setRole(r.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: role === r.value }}
                >
                  <View style={[styles.radioCircle, role === r.value && styles.radioCircleFilled]}>
                    {role === r.value && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, role === r.value && styles.optionLabelActive]}>
                      {r.label}
                    </Text>
                    <Text style={styles.optionSub}>{r.sub}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* CHPS Facility — cascading Region → District → Facility */}
          <View style={styles.fieldGroup}>
            <View style={styles.iconLabelRow}>
              <Building2 size={15} color="#8D9CA5" />
              <Text style={styles.fieldLabel}>
                CHPS facility <Text style={styles.optionalTag}>(optional)</Text>
              </Text>
            </View>

            {facilitiesLoading ? (
              <View style={styles.facilitiesLoading}>
                <ActivityIndicator size="small" color="#8D9CA5" />
                <Text style={styles.facilitiesLoadingText}>Loading facilities…</Text>
              </View>
            ) : facilities.length === 0 ? (
              <Text style={styles.facilitiesEmpty}>No facilities available. You can update this later.</Text>
            ) : (
              <View style={styles.cascadeContainer}>
                {/* Step 1 — Region */}
                <PickerButton
                  icon={<MapPin size={16} color={selectedRegion ? '#FF5A00' : '#8D9CA5'} />}
                  label="Region"
                  value={selectedRegion}
                  placeholder="Select region…"
                  onPress={() => setRegionModalOpen(true)}
                />

                {/* Step 2 — District (only after region chosen) */}
                <PickerButton
                  icon={<MapPin size={16} color={selectedDistrict ? '#FF5A00' : '#8D9CA5'} />}
                  label="District"
                  value={selectedDistrict}
                  placeholder="Select district…"
                  onPress={() => setDistrictModalOpen(true)}
                  disabled={!selectedRegion}
                />

                {/* Step 3 — CHPS compound (only after district chosen) */}
                <PickerButton
                  icon={<Building2 size={16} color={facilityId ? '#FF5A00' : '#8D9CA5'} />}
                  label="CHPS compound"
                  value={selectedFacilityName}
                  placeholder="Select facility…"
                  onPress={() => setFacilityModalOpen(true)}
                  disabled={!selectedDistrict}
                />

                {/* Selection summary */}
                {facilityId && (
                  <View style={styles.facilitySummary}>
                    <Check size={13} color="#4ADE80" />
                    <Text style={styles.facilitySummaryText}>
                      {selectedFacilityName} · {selectedDistrict} · {selectedRegion}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSelectedRegion(null);
                        setSelectedDistrict(null);
                        setFacilityId(null);
                      }}
                      style={styles.facilityClearBtn}
                      accessibilityLabel="Clear facility selection"
                    >
                      <X size={13} color="#8D9CA5" />
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Error */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
            onPress={handleSignUp}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading
              ? <ActivityIndicator color="#FDFDFD" size="small" />
              : <Text style={styles.submitBtnText}>Create account</Text>}
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="link"
          >
            <Text style={styles.footerLink}> Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Region picker modal */}
      <DarkPickerModal
        visible={regionModalOpen}
        title="Select region"
        items={regions}
        selectedValue={selectedRegion}
        onSelect={handleRegionSelect}
        onDismiss={() => setRegionModalOpen(false)}
        searchable={regions.length > 6}
      />

      {/* District picker modal */}
      <DarkPickerModal
        visible={districtModalOpen}
        title="Select district"
        items={districts}
        selectedValue={selectedDistrict}
        onSelect={handleDistrictSelect}
        onDismiss={() => setDistrictModalOpen(false)}
        searchable={districts.length > 6}
      />

      {/* Facility picker modal */}
      <DarkPickerModal
        visible={facilityModalOpen}
        title="Select CHPS compound"
        items={filteredFacilities}
        selectedValue={facilityId}
        onSelect={setFacilityId}
        onDismiss={() => setFacilityModalOpen(false)}
        searchable
      />
    </View>
  );
}

const BRAND = '#FF5A00';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08283B',
  },
  scroll: {
    flexGrow: 1,
    paddingTop: 52,
    paddingHorizontal: 28,
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FDFDFD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heading: {
    fontSize: 26,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#FDFDFD',
    marginBottom: 6,
  },
  headingSub: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#8D9CA5',
    marginBottom: 28,
  },

  form: {
    gap: 0,
  },

  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#C2D0D9',
    marginBottom: 8,
  },
  optionalTag: {
    fontWeight: '400',
    color: '#5A6F7C',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: '#FDFDFD',
    padding: 0,
  },
  inputFlex: {
    flex: 1,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 6,
  },

  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },

  optionList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionRowActive: {
    borderColor: BRAND,
    backgroundColor: 'rgba(255,90,0,0.08)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#5A6F7C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleFilled: {
    borderColor: BRAND,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: BRAND,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#8D9CA5',
    marginBottom: 2,
  },
  optionLabelActive: {
    color: '#FDFDFD',
  },
  optionSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#5A6F7C',
    lineHeight: 16,
  },

  cascadeContainer: {
    gap: 0,
  },
  facilitySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 6,
  },
  facilitySummaryText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#A7F3D0',
    lineHeight: 16,
  },
  facilityClearBtn: {
    padding: 4,
  },

  facilitiesLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  facilitiesLoadingText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#5A6F7C',
  },
  facilitiesEmpty: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#5A6F7C',
    paddingVertical: 8,
  },

  errorText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#FC8181',
    marginBottom: 12,
    lineHeight: 18,
  },

  submitBtn: {
    height: 52,
    backgroundColor: BRAND,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  submitBtnPressed: {
    opacity: 0.85,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FDFDFD',
    letterSpacing: 0.2,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#8D9CA5',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: BRAND,
    fontWeight: '600',
  },
});
