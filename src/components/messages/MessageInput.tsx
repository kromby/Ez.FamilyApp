import React, { useState, useCallback } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';

interface Props {
  channelName: string;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ channelName, onSend, disabled = false }: Props) {
  const colors = useThemeColors();
  const [text, setText] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }, [text, onSend]);

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <TextInput
        style={[styles.input, Typography.body, { color: colors.textPrimary }]}
        placeholder={`Message #${channelName}`}
        placeholderTextColor={colors.textSecondary}
        value={text}
        onChangeText={setText}
        multiline={false}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        editable={!disabled}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={styles.sendButton}
        accessibilityLabel="Send message"
        hitSlop={8}
      >
        <Ionicons
          name="send"
          size={20}
          color={canSend ? colors.accent : colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 36,
    paddingHorizontal: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
