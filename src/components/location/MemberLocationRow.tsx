import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';
import type { MemberLocation } from '../../lib/api';
import { MapCard, timeAgo } from './MapCard';

interface MemberLocationRowProps {
  member: MemberLocation;
  expanded: boolean;
  onPress: () => void;
}

function getAddressOpacity(updatedAt: string | null): number {
  if (!updatedAt) return 1;
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return hours > 24 ? 0.6 : 1;
}

export function MemberLocationRow({ member, expanded, onPress }: MemberLocationRowProps) {
  const colors = useThemeColors();
  const hasLocation = member.latitude !== null && member.shareLocation !== false;
  const opacity = hasLocation && member.updatedAt ? getAddressOpacity(member.updatedAt) : 1;

  function renderAddressLine() {
    if (!member.shareLocation) {
      return (
        <Text style={[Typography.label, { color: colors.textSecondary }]}>
          Location sharing off
        </Text>
      );
    }
    if (member.latitude === null) {
      return (
        <Text style={[Typography.label, { color: colors.textSecondary }]}>
          No location yet
        </Text>
      );
    }
    return (
      <Text style={[Typography.label, { color: colors.textSecondary, opacity }]}>
        {member.address ?? 'Unknown address'}
      </Text>
    );
  }

  return (
    <>
      <Pressable
        onPress={onPress}
        style={[styles.row, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        {/* Avatar circle */}
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.avatarText}>
            {member.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Text column */}
        <View style={styles.textColumn}>
          <Text style={[Typography.label, { fontWeight: '600', color: colors.textPrimary }]}>
            {member.displayName}
          </Text>
          {renderAddressLine()}
          {hasLocation && member.updatedAt && (
            <Text style={[Typography.label, { color: colors.textSecondary, opacity }]}>
              {timeAgo(member.updatedAt)}
            </Text>
          )}
        </View>

        {/* Chevron — only if member has location */}
        {hasLocation && (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
        )}
      </Pressable>

      {hasLocation && member.latitude !== null && member.longitude !== null && member.updatedAt && (
        <MapCard
          latitude={member.latitude}
          longitude={member.longitude}
          address={member.address}
          updatedAt={member.updatedAt}
          memberName={member.displayName}
          expanded={expanded}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    ...Typography.body,
    fontWeight: '600',
  },
  textColumn: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
});
