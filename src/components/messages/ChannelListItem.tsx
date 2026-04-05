import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';
import type { Channel } from '../../lib/api';

interface Props {
  channel: Channel;
  onPress: () => void;
  isUnread?: boolean;
}

function formatTimestamp(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export function ChannelListItem({ channel, onPress, isUnread = false }: Props) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border, backgroundColor: pressed ? colors.surface : 'transparent' },
      ]}
    >
      <View style={styles.left}>
        <Text
          style={[
            Typography.body,
            { color: colors.textPrimary, fontWeight: isUnread ? '700' : '400' },
          ]}
          numberOfLines={1}
        >
          #{channel.name}
        </Text>
        {channel.lastMessageText && (
          <Text
            style={[Typography.label, { color: colors.textSecondary, marginTop: 2 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {channel.lastMessageText}
          </Text>
        )}
      </View>
      {channel.lastMessageAt && (
        <Text style={[Typography.label, { color: colors.textSecondary }]}>
          {formatTimestamp(channel.lastMessageAt)}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  left: {
    flex: 1,
    marginRight: Spacing.sm,
  },
});
