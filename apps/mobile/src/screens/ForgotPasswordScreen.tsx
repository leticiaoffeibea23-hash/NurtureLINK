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
import { ChevronLeft, Phone, MessageCircle } from 'lucide-react-native';

import { RootStackParamList } from '../../App';
import { LogoMark } from '../assets/LogoMark';
import { fonts } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8181';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const trimmed = phone.trim();
    if (trimmed.length < 10) {
      setError('Enter a valid phone number.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmed }),
      });

      if (res.ok) {
        navigation.replace('VerifyAccount', {
          mode: 'password-reset',
          phone: trimmed,
        });
      } else if (res.status === 404) {
        setError('No account found with this phone number.');
      } else {
        setError('Unable to send reset code. Please try again.');
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

        {/* Icon badge */}
        <View style={styles.iconBadge}>
          <MessageCircle size={32} color="#FF5A00" />
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Reset password</Text>
        <Text style={styles.headingSub}>
          Enter your registered phone number. We'll send a 6-digit code via SMS.
        </Text>

        {/* Form */}
        <View style={styles.form}>
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
                returnKeyType="done"
                onSubmitEditing={handleSend}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.sendBtn, pressed && styles.sendBtnPressed]}
            onPress={handleSend}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading
              ? <ActivityIndicator color="#FDFDFD" size="small" />
              : <Text style={styles.sendBtnText}>Send reset code</Text>}
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Remembered it?</Text>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="link"
          >
            <Text style={styles.footerLink}> Back to sign in</Text>
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

  errorText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#FC8181',
    marginBottom: 12,
    lineHeight: 18,
  },

  sendBtn: {
    height: 52,
    backgroundColor: BRAND,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  sendBtnPressed: {
    opacity: 0.85,
  },
  sendBtnText: {
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
