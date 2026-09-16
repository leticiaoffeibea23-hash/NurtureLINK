import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../theme';

interface Props {
  food: {
    id: string;
    name: string;
    localName: string;
    reasons: string[];
  };
}

const REASON_LABELS: Record<string, string> = {
  in_season_abundant: 'In season (abundant)',
  in_season_available: 'Available now',
  storable_year_round: 'Available year-round',
  garden_or_wild: 'From garden or wild',
  affordable_staple: 'Affordable',
  closes_ironMg_gap: 'Good source of iron',
  closes_folateUg_gap: 'Good source of folate',
  closes_proteinG_gap: 'Good source of protein',
  closes_energyKcal_gap: 'Good source of energy',
  closes_vitAUgRae_gap: 'Good source of vitamin A',
  closes_zincMg_gap: 'Good source of zinc',
};

export function PlanCard({ food }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.nameRow}>
        <Text style={styles.localName}>{food.localName || food.name}</Text>
        {food.localName && <Text style={styles.engName}>{food.name}</Text>}
      </View>
      <View style={styles.reasons}>
        {food.reasons.map((r) => (
          <View key={r} style={styles.reasonChip}>
            <Text style={styles.reasonText}>{REASON_LABELS[r] ?? r}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#1a7c4e',
  },
  nameRow: { marginBottom: 8 },
  localName: { fontSize: 18, fontFamily: fonts.bold, fontWeight: '700', color: '#111' },
  engName: { fontSize: 13, fontFamily: fonts.regular, color: '#666', marginTop: 2 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reasonChip: {
    backgroundColor: '#e8f5ee',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reasonText: { fontSize: 12, fontFamily: fonts.medium, color: '#1a7c4e', fontWeight: '500' },
});
