import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Shield, RefreshCw, User } from 'lucide-react-native';
import { fonts } from '../theme';

const BRAND = '#FF5A00';
const INACTIVE = '#9CA3AF';

interface Props {
  active: 'home' | 'referrals' | 'sync' | 'profile';
  onHome: () => void;
  onReferrals: () => void;
  onSync: () => void;
  onProfile: () => void;
  referralBadge?: number;
}

export function BottomTabBar({ active, onHome, onReferrals, onSync, onProfile, referralBadge }: Props) {
  const tabs: {
    key: 'home' | 'referrals' | 'sync' | 'profile';
    label: string;
    getIcon: (isActive: boolean) => React.ReactNode;
    onPress: () => void;
  }[] = [
    {
      key: 'home',
      label: 'Home',
      getIcon: (a) => <Home size={22} color={a ? BRAND : INACTIVE} />,
      onPress: onHome,
    },
    {
      key: 'referrals',
      label: 'Referrals',
      getIcon: (a) => <Shield size={22} color={a ? BRAND : INACTIVE} />,
      onPress: onReferrals,
    },
    {
      key: 'sync',
      label: 'Sync',
      getIcon: (a) => <RefreshCw size={22} color={a ? BRAND : INACTIVE} />,
      onPress: onSync,
    },
    {
      key: 'profile',
      label: 'Profile',
      getIcon: (a) => <User size={22} color={a ? BRAND : INACTIVE} />,
      onPress: onProfile,
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={tab.onPress}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            {/* Active indicator bar at top */}
            <View style={[styles.activeBar, isActive && styles.activeBarVisible]} />

            {/* Icon with optional pill background */}
            <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
              {tab.getIcon(isActive)}
              {tab.key === 'referrals' && referralBadge !== undefined && referralBadge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{referralBadge > 99 ? '99+' : referralBadge}</Text>
                </View>
              )}
            </View>

            {/* Label */}
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FDFDFD',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 22,
    paddingTop: 8,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  activeBar: {
    position: 'absolute',
    top: -8,
    width: '60%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  activeBarVisible: {
    backgroundColor: BRAND,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 32,
    borderRadius: 16,
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(255, 90, 0, 0.10)',
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.regular,
  },
  labelActive: {
    fontFamily: fonts.bold,
    color: BRAND,
    fontWeight: '700',
  },
  labelInactive: {
    fontFamily: fonts.medium,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 4,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#C81E1E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.bold,
    fontWeight: '700',
    lineHeight: 13,
  },
});
