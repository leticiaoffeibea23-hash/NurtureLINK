import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Severity } from '@nurturelink/shared';
import { fonts } from '../theme';

const COLORS: Record<Severity, { bg: string; text: string }> = {
  ok: { bg: '#d4edda', text: '#155724' },
  watch: { bg: '#fff3cd', text: '#856404' },
  refer: { bg: '#f8d7da', text: '#721c24' },
};

interface Props {
  severity: Severity;
  label: string;
}

export function FlagBadge({ severity, label }: Props) {
  const colors = COLORS[severity];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  text: { fontSize: 12, fontFamily: fonts.semiBold, fontWeight: '600' },
});
