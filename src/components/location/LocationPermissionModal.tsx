import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';

interface Props {
  visible: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

export function LocationPermissionModal({ visible, onAllow, onDismiss }: Props) {
  const colors = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
          accessibilityViewIsModal={true}
        >
          <View style={[styles.iconWrapper, { marginTop: Spacing['2xl'] }]}>
            <Ionicons name="location" size={48} color={colors.accent} />
          </View>

          <Text style={[Typography.heading, styles.heading, { color: colors.textPrimary }]}>
            Stay in the loop
          </Text>

          <Text style={[Typography.body, styles.body, { color: colors.textSecondary }]}>
            Your family can see where you last were when you send a message. You can turn this off anytime in your profile.
          </Text>

          <Pressable
            style={[styles.allowButton, { backgroundColor: colors.accent }]}
            onPress={onAllow}
            accessibilityRole="button"
          >
            <Text style={[Typography.body, styles.allowButtonText]}>
              Allow location access
            </Text>
          </Pressable>

          <Pressable
            style={styles.dismissButton}
            onPress={onDismiss}
            accessibilityRole="button"
          >
            <Text style={[Typography.label, styles.dismissButtonText, { color: colors.textSecondary }]}>
              Not now
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 16,
    padding: Spacing.xl,
    maxWidth: 320,
    width: '85%',
    alignItems: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
  },
  heading: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  body: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  allowButton: {
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    width: '100%',
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  dismissButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  dismissButtonText: {
    textAlign: 'center',
  },
});
