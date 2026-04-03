import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';

export default function WelcomeScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.heading}>Welcome to</Text>
          <Text style={styles.display}>ez.familyapp</Text>
          <Text style={styles.subtitle}>Stay connected and coordinated with your family.</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/create-family')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Create a Family</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.outlineButton, { borderColor: colors.accent }]}
            onPress={() => router.push('/(auth)/join-family')}
            activeOpacity={0.8}
          >
            <Text style={[styles.outlineButtonText, { color: colors.accent }]}>Join a Family</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing['3xl'],
      paddingBottom: Spacing.xl,
      justifyContent: 'space-between',
    },
    hero: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: Spacing['2xl'],
    },
    heading: {
      ...Typography.heading,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    display: {
      ...Typography.display,
      color: colors.textPrimary,
      marginBottom: Spacing.md,
    },
    subtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    buttons: {
      gap: Spacing.sm,
    },
    primaryButton: {
      backgroundColor: colors.accent,
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    outlineButton: {
      backgroundColor: 'transparent',
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outlineButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
  });
}
