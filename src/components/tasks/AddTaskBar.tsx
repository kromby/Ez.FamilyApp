import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';

interface AddTaskBarProps {
  onAdd: (name: string) => void;
  autoFocus: boolean;
}

export default function AddTaskBar({ onAdd, autoFocus }: AddTaskBarProps) {
  const colors = useThemeColors();
  const [text, setText] = useState('');

  const hasText = text.trim().length > 0;

  function handleAdd() {
    if (!hasText) return;
    onAdd(text.trim());
    setText('');
  }

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    input: {
      flex: 1,
      ...Typography.body,
      color: colors.textPrimary,
      marginRight: Spacing.sm,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      opacity: hasText ? 1 : 0.4,
    },
    addButtonText: {
      color: '#FFFFFF',
      ...Typography.label,
      fontWeight: '600' as const,
      marginLeft: 2,
    },
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="New task..."
        placeholderTextColor={colors.textSecondary}
        maxLength={200}
        autoFocus={autoFocus}
        returnKeyType="send"
        onSubmitEditing={handleAdd}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAdd}
        disabled={!hasText}
        accessibilityState={{ disabled: !hasText }}
      >
        <Ionicons name="add" size={16} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}
