import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';

export function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface MapCardProps {
  latitude: number;
  longitude: number;
  address: string | null;
  updatedAt: string;
  memberName: string;
  expanded: boolean;
}

export function MapCard({
  latitude,
  longitude,
  address,
  updatedAt,
  memberName,
  expanded,
}: MapCardProps) {
  const colors = useThemeColors();
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withTiming(expanded ? 120 : 0, { duration: 250 });
  }, [expanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden',
  }));

  const minutes = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000);
  const relativeTime = minutes < 1 ? 'just now' : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`;

  return (
    <Animated.View style={animatedStyle}>
      <View
        style={[styles.container, { backgroundColor: colors.surface }]}
        accessibilityLabel={`${memberName}'s last known location, ${address ?? 'Unknown address'}, ${relativeTime}`}
      >
        <View style={[styles.mapPlaceholder, { backgroundColor: colors.background }]}>
          <Text style={[Typography.label, { color: colors.textSecondary }]}>
            Map not available on web
          </Text>
        </View>
        <View style={styles.textArea}>
          <Text style={[Typography.body, { color: colors.textPrimary }]}>
            {address ?? 'Unknown address'}
          </Text>
          <Text style={[Typography.label, { color: colors.textSecondary, marginTop: 2 }]}>
            Last seen {relativeTime}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    padding: Spacing.md,
  },
});
