import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Eye, EyeOff, Phone, Lock, WifiOff } from 'lucide-react-native';

import { RootStackParamList } from '../../App';
import { LogoMark } from '../assets/LogoMark';
import { useAppStore } from '../store';
import { fonts } from '../theme';
import { storeTokens, storeSession } from '../auth/session';
import type { Role } from '../store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8181';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

function mapServerRole(serverRole: string): Role {
  if (serverRole === 'supervisor') return 'sup';
  return 'cho';
}

export function LoginScreen({ navigation }: Props) {
  const login = useAppStore((s) => s.login);
  const loadUserData = useAppStore((s) => s.loadUserData);
  const seedDemoData = useAppStore((s) => s.seedDemoData);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!phone.trim() || !password.trim()) {
      setError('Phone number and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });

      if (res.ok) {
        const data = await res.json() as {
          accessToken: string;
          refreshToken: string;
          user: {
            id: string;
            firstName: string;
            lastName: string;
            otherNames?: string | null;
            role: string;
            phone?: string;
            facilityName?: string | null;
            facilityDistrict?: string | null;
            facilityRegion?: string | null;
          };
        };
        // Token storage is best-effort — on web expo-secure-store falls back to
        // localStorage but may throw; a failure here must not block login.
        storeTokens(data.accessToken, data.refreshToken).catch((e) =>
          console.warn('[Login] storeTokens failed (non-fatal):', e),
        );
        const role = mapServerRole(data.user.role);
        login({
          id:               data.user.id,
          firstName:        data.user.firstName,
          lastName:         data.user.lastName,
          otherNames:       data.user.otherNames ?? null,
          phone:            phone.trim(),
          role,
          facilityName:     data.user.facilityName ?? null,
          facilityDistrict: data.user.facilityDistrict ?? null,
          facilityRegion:   data.user.facilityRegion ?? null,
          avatarUri:        null,
        });
        // Fire-and-forget: load real data in the background; UI navigates immediately
        loadUserData(data.accessToken).catch((e) =>
          console.warn('[Login] loadUserData failed (non-fatal):', e),
        );
        navigation.replace(role === 'sup' ? 'Supervisor' : 'Home');
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        if (res.status === 403) {
          setError('Account not verified. Check your SMS for a verification code.');
        } else {
          setError(body.error ?? 'Invalid credentials.');
        }
      }
    } catch (e) {
      console.error('[Login] unexpected error:', e);
      setError('No connection. Tap "Work offline" to continue without syncing.');
    } finally {
      setLoading(false);
    }
  }

  function handleDemoMode() {
    seedDemoData();
    navigation.replace('Home');
  }

  async function handleOffline() {
    setError(null);
    setLoading(true);
    try {
      await storeSession('cho');
      login({ id: 'offline', firstName: 'Offline', lastName: 'User', otherNames: null, phone: '', role: 'cho', facilityName: null, facilityDistrict: null, facilityRegion: null, avatarUri: null });
      navigation.replace('Home');
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
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <LogoMark size={22} onDark={false} />
          </View>
          <Text style={styles.logoLabel}>NurtureLink</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.headingSub}>Sign in to access your caseload</Text>

        {/* Form */}
        <View style={styles.form}>
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
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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

          {/* Forgot password */}
          <Pressable
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotRow}
            accessibilityRole="link"
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          {/* Error */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Login button */}
          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && styles.loginBtnPressed]}
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading
              ? <ActivityIndicator color="#FDFDFD" size="small" />
              : <Text style={styles.loginBtnText}>Sign in</Text>}
          </Pressable>

          {/* Demo mode */}
          <Pressable
            style={styles.demoBtn}
            onPress={handleDemoMode}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Launch demo with sample data"
          >
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>DEMO</Text>
            </View>
            <Text style={styles.demoBtnText}>Try with sample caseload</Text>
          </Pressable>

          {/* Offline mode */}
          <Pressable
            style={styles.offlineBtn}
            onPress={handleOffline}
            disabled={loading}
            accessibilityRole="button"
          >
            <WifiOff size={15} color="#8D9CA5" />
            <Text style={styles.offlineBtnText}>Work offline</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Pressable
            onPress={() => navigation.navigate('SignUp')}
            accessibilityRole="link"
          >
            <Text style={styles.footerLink}> Create account</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    paddingTop: 48,
    paddingHorizontal: 28,
    paddingBottom: 32,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 36,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FDFDFD',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoLabel: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FDFDFD',
    letterSpacing: 0.1,
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
    marginBottom: 32,
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

  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: BRAND,
    fontWeight: '500',
  },

  errorText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#FC8181',
    marginBottom: 12,
    lineHeight: 18,
  },

  loginBtn: {
    height: 52,
    backgroundColor: BRAND,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loginBtnPressed: {
    opacity: 0.85,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FDFDFD',
    letterSpacing: 0.2,
  },

  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,90,0,0.35)',
    backgroundColor: 'rgba(255,90,0,0.08)',
    marginBottom: 10,
  },
  demoBadge: {
    backgroundColor: BRAND,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  demoBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  demoBtnText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#FF8040',
    fontWeight: '600',
  },

  offlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  offlineBtnText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#8D9CA5',
    fontWeight: '500',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 32,
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
