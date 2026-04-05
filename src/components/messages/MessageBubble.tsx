import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';
import type { Message } from '../../lib/api';

interface Props {
  message: Message;
  isFirstInGroup: boolean;
  onLongPress?: () => void;
  children?: React.ReactNode; // reaction chips slot
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isFirstInGroup, onLongPress, children }: Props) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        { marginTop: isFirstInGroup ? Spacing.sm : Spacing.xs },
      ]}
    >
      {isFirstInGroup && (
        <View style={styles.senderRow}>
          <Text style={[Typography.label, { color: colors.textPrimary, fontWeight: '700' }]}>
            {message.senderName}
          </Text>
          <Text style={[Typography.label, { color: colors.textSecondary, marginLeft: Spacing.xs }]}>
            {formatTime(message.createdAt)}
          </Text>
        </View>
      )}
      <View style={styles.textRow}>
        {message.status === 'error' && (
          <View
            style={[styles.errorDot, { backgroundColor: colors.destructive }]}
            accessibilityLabel="Message failed to send"
          />
        )}
        <Text
          style={[Typography.body, { color: colors.textPrimary, flex: 1 }]}
          onLongPress={onLongPress}
        >
          {message.text}
        </Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
    marginTop: 8, // vertically center with first line of text (lineHeight 24 / 2 - 4)
  },
});
