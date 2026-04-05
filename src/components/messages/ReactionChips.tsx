import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';
import type { ReactionGroup } from '../../lib/api';

interface Props {
  reactions: ReactionGroup[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
}

export function ReactionChips({ reactions, currentUserId, onToggle }: Props) {
  const colors = useThemeColors();

  if (!reactions || reactions.length === 0) return null;

  return (
    <View style={styles.container}>
      {reactions.map((reaction) => {
        const isOwn = reaction.userIds.includes(currentUserId);
        return (
          <Pressable
            key={reaction.emoji}
            onPress={() => onToggle(reaction.emoji)}
            accessibilityLabel={`${reaction.emoji} reaction, ${reaction.count} people`}
            accessibilityRole="button"
            style={[
              styles.chip,
              {
                backgroundColor: colors.surface,
                borderColor: isOwn ? colors.accent : colors.border,
              },
            ]}
          >
            <Text style={[Typography.label, { color: colors.textPrimary }]}>
              {reaction.emoji} {reaction.count}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 44, // touch target accessibility
    justifyContent: 'center',
  },
});
