import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';

interface LocationWarningBannerProps {
  type: 'toggle-off' | 'permission-denied';
}

export function LocationWarningBanner({ type }: LocationWarningBannerProps) {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      <Ionicons
        name="warning-outline"
        size={20}
        color={colors.textSecondary}
        style={styles.icon}
      />
      {type === 'toggle-off' ? (
        <Text style={[Typography.body, styles.text, { color: colors.textPrimary }]}>
          {'Location sharing is off. Turn it on in your '}
          <Text
            style={{ color: colors.accent }}
            onPress={() => router.push('/(tabs)/profile')}
          >
            profile
          </Text>
          {'.'}
        </Text>
      ) : (
        <Text style={[Typography.body, styles.text, { color: colors.textPrimary }]}>
          {'Location access is blocked. Enable it in your device '}
          <Text
            style={{ color: colors.accent }}
            onPress={() => Linking.openSettings()}
          >
            Settings
          </Text>
          {'.'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    flex: 1,
  },
});
