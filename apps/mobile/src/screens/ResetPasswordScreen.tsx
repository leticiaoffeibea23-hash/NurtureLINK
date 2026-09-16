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
import { ChevronLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';

import { RootStackParamList } from '../../App';
import { LogoMark } from '../assets/LogoMark';
import { fonts } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8181';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { phone, code } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  }

  async function handleReset() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, password }),
      });

      if (res.ok) {
        setSuccess(true);
      } else if (res.status === 400) {
        setError('The reset code has expired. Please request a new one.');
      } else {
        setError('Password reset failed. Please try again.');
      }
    } catch {
      setError('No connection. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.root}>
        <View style={styles.successContainer}>
          <View style={styles.successBadge}>
            <CheckCircle size={40} color="#68D391" />
          </View>
          <Text style={styles.successHeading}>Password updated</Text>
          <Text style={styles.successSub}>
            Your password has been changed successfully. Sign in with your new password.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.signInBtn, pressed && styles.signInBtnPressed]}
            onPress={() => navigation.replace('Login')}
            accessibilityRole="button"
          >
            <Text style={styles.signInBtnText}>Back to sign in</Text>
          </Pressable>
        </View>
      </View>
    );
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

        {/* Icon badge */}
        <View style={styles.iconBadge}>
          <Lock size={32} color="#FF5A00" />
        </View>

        {/* Heading */}
        <Text style={styles.heading}>New password</Text>
        <Text style={styles.headingSub}>
          Choose a strong password of at least 8 characters.
        </Text>

        {/* Form */}
        <View style={styles.form}>
          {/* New password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>New password</Text>
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
                onSubmitEditing={handleReset}
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

          {/* Strength hint */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={[
                styles.strengthBar,
                password.length >= 8 ? styles.strengthGood : styles.strengthWeak,
              ]} />
              <Text style={styles.strengthText}>
                {password.length < 8 ? 'Too short' : password.length < 12 ? 'Good' : 'Strong'}
              </Text>
            </View>
          )}

          {/* Error */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [styles.resetBtn, pressed && styles.resetBtnPressed]}
            onPress={handleReset}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading
              ? <ActivityIndicator color="#FDFDFD" size="small" />
              : <Text style={styles.resetBtnText}>Set new password</Text>}
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
    paddingTop: 52,
    paddingHorizontal: 28,
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
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

  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,90,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  heading: {
    fontSize: 26,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#FDFDFD',
    marginBottom: 8,
  },
  headingSub: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#8D9CA5',
    lineHeight: 20,
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

  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: -8,
  },
  strengthBar: {
    height: 3,
    flex: 1,
    borderRadius: 2,
  },
  strengthWeak: {
    backgroundColor: '#FC8181',
  },
  strengthGood: {
    backgroundColor: '#68D391',
  },
  strengthText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#8D9CA5',
    width: 50,
  },

  errorText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#FC8181',
    marginBottom: 12,
    lineHeight: 18,
  },

  resetBtn: {
    height: 52,
    backgroundColor: BRAND,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  resetBtnPressed: {
    opacity: 0.85,
  },
  resetBtnText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FDFDFD',
    letterSpacing: 0.2,
  },

  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(104,211,145,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successHeading: {
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#FDFDFD',
    marginBottom: 10,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#8D9CA5',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 36,
  },
  signInBtn: {
    height: 52,
    backgroundColor: BRAND,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    alignSelf: 'stretch',
  },
  signInBtnPressed: {
    opacity: 0.85,
  },
  signInBtnText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FDFDFD',
    letterSpacing: 0.2,
  },
});
