import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useThemeColors, Spacing } from '../../constants/theme';

const EMOJI_OPTIONS = [
  '\uD83D\uDC4D', // thumbs up
  '\u2764\uFE0F', // heart
  '\uD83D\uDE02', // laugh
  '\uD83D\uDE2E', // surprised
  '\uD83D\uDE22', // sad
  '\uD83D\uDE21', // angry
];

interface Props {
  visible: boolean;
  onSelect: (emoji: string) => void;
  onDismiss: () => void;
}

export function ReactionPicker({ visible, onSelect, onDismiss }: Props) {
  const colors = useThemeColors();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {EMOJI_OPTIONS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => onSelect(emoji)}
              style={styles.emojiButton}
              accessibilityLabel={`React with ${emoji}`}
              accessibilityRole="button"
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

export { EMOJI_OPTIONS };

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  picker: {
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  emojiButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
});
