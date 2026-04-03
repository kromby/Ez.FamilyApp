import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';
import { useSession } from '../../stores/session';

export default function ShareCodeScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { signIn } = useSession();

  const { familyCode, familyName, token, userId, displayName, familyId } = useLocalSearchParams<{
    familyCode: string;
    familyName: string;
    token: string;
    userId: string;
    displayName: string;
    familyId: string;
  }>();

  async function handleCopyCode() {
    await Clipboard.setStringAsync(familyCode);
  }

  async function handleContinue() {
    await signIn(token, {
      id: userId,
      displayName,
      familyId,
      familyName,
    });
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Your family is ready!</Text>
        <Text style={styles.subtitle}>
          Share this code with your family members so they can join {familyName}.
        </Text>

        <View style={styles.codeSection}>
          <View style={[styles.codeBox, { borderColor: colors.border }]}>
            <Text style={[styles.codeText, { color: colors.accent }]}>{familyCode}</Text>
          </View>

          <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.7}>
            <Text style={[styles.copyButton, { color: colors.accent }]}>Copy Code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Continue to App</Text>
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
    },
    heading: {
      ...Typography.display,
      color: colors.textPrimary,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.xl,
    },
    codeSection: {
      alignItems: 'center',
      gap: Spacing.md,
    },
    codeBox: {
      width: '100%',
      borderWidth: 1,
      borderRadius: 8,
      padding: Spacing.lg,
      alignItems: 'center',
    },
    codeText: {
      fontSize: 28,
      fontWeight: '600' as const,
      letterSpacing: 4,
    },
    copyButton: {
      ...Typography.label,
    },
    footer: {
      marginTop: 'auto' as const,
      paddingTop: Spacing.xl,
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
  });
}
