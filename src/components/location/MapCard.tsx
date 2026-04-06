import React, { useEffect } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
    height.value = withTiming(expanded ? 200 : 0, { duration: 250 });
  }, [expanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden',
  }));

  const relativeTime = timeAgo(updatedAt);

  return (
    <Animated.View style={animatedStyle}>
      <View
        style={[styles.container, { backgroundColor: colors.surface }]}
        accessibilityLabel={`${memberName}'s last known location, ${address ?? 'Unknown address'}, ${relativeTime}`}
      >
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          region={{
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          style={styles.map}
        >
          <Marker
            coordinate={{ latitude, longitude }}
            pinColor={colors.accent}
          />
        </MapView>
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
  map: {
    width: '100%',
    height: 150,
  },
  textArea: {
    padding: Spacing.md,
  },
});
