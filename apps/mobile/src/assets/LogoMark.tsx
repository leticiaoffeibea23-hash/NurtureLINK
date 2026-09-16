/**
 * NurtureLink logomark — rendered as pure React Native Views.
 *
 * Faithfully approximates the sprouting-heart icon from the design system
 * without requiring react-native-svg. Install react-native-svg and replace
 * with SVG paths for pixel-perfect output.
 */
import React from 'react';
import { View } from 'react-native';

interface Props {
  size?: number;
  onDark?: boolean;
}

export function LogoMark({ size = 54, onDark = false }: Props) {
  const heartFill = onDark ? '#FDFDFD' : '#08283B';
  // const s = size / 54; // scale factor

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Heart body */}
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.04,
          width: size * 0.72,
          height: size * 0.56,
          borderRadius: size * 0.28,
          backgroundColor: heartFill,
        }}
      />
      {/* Left lobe */}
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.3,
          left: size * 0.1,
          width: size * 0.36,
          height: size * 0.36,
          borderRadius: size * 0.18,
          backgroundColor: heartFill,
        }}
      />
      {/* Right lobe */}
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.3,
          right: size * 0.1,
          width: size * 0.36,
          height: size * 0.36,
          borderRadius: size * 0.18,
          backgroundColor: heartFill,
        }}
      />
      {/* Stem (orange) */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.05,
          left: size * 0.48,
          width: Math.max(2, size * 0.065),
          height: size * 0.3,
          borderRadius: 2,
          backgroundColor: '#FF5A00',
        }}
      />
      {/* Left leaf (lighter orange) */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.08,
          left: size * 0.2,
          width: size * 0.26,
          height: size * 0.22,
          borderRadius: size * 0.13,
          backgroundColor: '#FF7B33',
          transform: [{ rotate: '-20deg' }],
        }}
      />
      {/* Right leaf (accent orange) */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.08,
          right: size * 0.2,
          width: size * 0.26,
          height: size * 0.22,
          borderRadius: size * 0.13,
          backgroundColor: '#FF5A00',
          transform: [{ rotate: '20deg' }],
        }}
      />
    </View>
  );
}
