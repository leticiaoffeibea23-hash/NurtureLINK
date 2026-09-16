import React, { useRef, useState } from 'react';
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
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';

import { RootStackParamList } from '../../App';
import { LogoMark } from '../assets/LogoMark';
import { fonts } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8181';
const OTP_LENGTH = 6;

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyAccount'>;

export function VerifyAccountScreen({ navigation, route }: Props) {
  const { mode, phone } = route.params;

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const code = digits.join('');
  const isComplete = code.length === OTP_LENGTH;

  function handleDigit(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError(null);

    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    if (!isComplete) {
      setError('Enter all 6 digits of the code.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, mode }),
      });

      if (res.ok) {
        if (mode === 'registration') {
          navigation.replace('Login');
        } else {
          navigation.replace('ResetPassword', { phone, code });
        }
      } else if (res.status === 400) {
        setError('Invalid or expired code. Please try again.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch {
      setError('No connection. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendMsg(null);
    setError(null);
    setResendLoading(true);

    const endpoint = mode === 'registration'
      ? `${API_URL}/auth/resend-verification`
      : `${API_URL}/auth/forgot-password`;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      setResendMsg('A new code has been sent.');
    } catch {
      setError('Failed to resend code. Check your connection.');
    } finally {
      setResendLoading(false);
    }
  }

  const isRegistration = mode === 'registration';
  const maskedPhone = phone.length > 6
    ? `${phone.slice(0, 4)}****${phone.slice(-3)}`
    : phone;

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
          <ShieldCheck size={32} color="#FF5A00" />
        </View>

        {/* Heading */}
        <Text style={styles.heading}>
          {isRegistration ? 'Verify your account' : 'Verify your identity'}
        </Text>
        <Text style={styles.headingSub}>
          Enter the 6-digit code sent to {maskedPhone}.
        </Text>

        {/* OTP inputs */}
        <View style={styles.otpRow}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              style={[styles.otpInput, digits[i] ? styles.otpInputFilled : undefined]}
              value={digits[i]}
              onChangeText={(v) => handleDigit(i, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              accessibilityLabel={`Digit ${i + 1}`}
              textAlign="center"
            />
          ))}
        </View>

        {/* Error / resend message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {resendMsg ? <Text style={styles.resendSuccessText}>{resendMsg}</Text> : null}

        {/* Verify button */}
        <Pressable
          style={({ pressed }) => [
            styles.verifyBtn,
            !isComplete && styles.verifyBtnDisabled,
            pressed && isComplete && styles.verifyBtnPressed,
          ]}
          onPress={handleVerify}
          disabled={loading || !isComplete}
          accessibilityRole="button"
        >
          {loading
            ? <ActivityIndicator color="#FDFDFD" size="small" />
            : <Text style={styles.verifyBtnText}>
                {isRegistration ? 'Verify account' : 'Continue'}
              </Text>}
        </Pressable>

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <Pressable
            onPress={handleResend}
            disabled={resendLoading}
            accessibilityRole="button"
          >
            {resendLoading
              ? <ActivityIndicator size="small" color="#FF5A00" style={{ marginLeft: 6 }} />
              : <Text style={styles.resendLink}> Resend</Text>}
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

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FDFDFD',
  },
  otpInputFilled: {
    borderColor: BRAND,
    backgroundColor: 'rgba(255,90,0,0.08)',
  },

  errorText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#FC8181',
    marginBottom: 12,
    lineHeight: 18,
  },
  resendSuccessText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#68D391',
    marginBottom: 12,
  },

  verifyBtn: {
    height: 52,
    backgroundColor: BRAND,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verifyBtnDisabled: {
    opacity: 0.4,
  },
  verifyBtnPressed: {
    opacity: 0.85,
  },
  verifyBtnText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FDFDFD',
    letterSpacing: 0.2,
  },

  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#8D9CA5',
  },
  resendLink: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: BRAND,
    fontWeight: '600',
  },
});
