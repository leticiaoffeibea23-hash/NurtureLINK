import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Visit } from '@nurturelink/shared';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { fonts } from '../theme';

interface Props {
  visits: Visit[];
  clientType: 'pregnant' | 'child';
}

/**
 * Renders a simple longitudinal trend for the client's key nutrition metric.
 *
 * MVP: Simple text-based spark representation.
 * Post-MVP: Replace with a proper chart library (react-native-chart-kit or Victory).
 */
export function NutritionTrendChart({ visits, clientType }: Props) {
  const sorted = [...visits].sort(
    (a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime(),
  );

  const metric = clientType === 'pregnant' ? 'hbGDl' : 'weightKg';
  const label = clientType === 'pregnant' ? 'Haemoglobin (g/dL)' : 'Weight (kg)';

  const values = sorted
    .map((v) => (metric === 'hbGDl' ? v.hbGDl : v.weightKg))
    .filter((v): v is number => v !== null);

  if (values.length < 2) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Record at least 2 visits to see the {label} trend.
        </Text>
      </View>
    );
  }

  const trend = values[values.length - 1] - values[values.length - 2];
  const trendDir: 'up' | 'down' | 'flat' = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat';
  const trendText = trend > 0 ? 'Improving' : trend < 0 ? 'Declining' : 'Stable';
  const trendColor = trend > 0 ? '#1a7c4e' : trend < 0 ? '#c0392b' : '#888';

  return (
    <View style={styles.container}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.valuesRow}>
        {values.map((v, i) => (
          <View key={i} style={styles.valueItem}>
            <Text style={styles.valueText}>{v.toFixed(1)}</Text>
            <Text style={styles.visitLabel}>Visit {i + 1}</Text>
          </View>
        ))}
      </View>
      <View style={styles.trendRow}>
        {trendDir === 'up' ? (
          <TrendingUp size={16} color={trendColor} />
        ) : trendDir === 'down' ? (
          <TrendingDown size={16} color={trendColor} />
        ) : (
          <Minus size={16} color={trendColor} />
        )}
        <Text style={[styles.trend, { color: trendColor }]}>
          {trendText} ({Math.abs(trend).toFixed(1)})
        </Text>
      </View>
      {/* TODO: replace with react-native-chart-kit LineChart */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 8, padding: 16, elevation: 1 },
  metricLabel: { fontSize: 13, fontFamily: fonts.regular, color: '#666', marginBottom: 10 },
  valuesRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 10 },
  valueItem: { alignItems: 'center' },
  valueText: { fontSize: 18, fontFamily: fonts.bold, fontWeight: '700', color: '#111' },
  visitLabel: { fontSize: 11, fontFamily: fonts.regular, color: '#888', marginTop: 2 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trend: { fontSize: 15, fontFamily: fonts.semiBold, fontWeight: '600' },
  placeholder: { backgroundColor: '#fff', borderRadius: 8, padding: 16, alignItems: 'center' },
  placeholderText: { color: '#888', fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' },
});
