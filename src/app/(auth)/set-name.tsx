import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';
import { setDisplayName } from '../../api/client';
import { useSession } from '../../stores/session';

export default function SetNameScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { signIn } = useSession();

  const { token, familyId, familyName, intent, familyCode } = useLocalSearchParams<{
    token: string;
    familyId: string;
    familyName: string;
    intent: 'create' | 'join';
    familyCode?: string;
  }>();

  const [displayName, setDisplayNameState] = useState('');
  const [error, setError] = useState('');
  const [networkError, setNetworkError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  async function handleSubmit() {
    setError('');
    setNetworkError('');

    if (!displayName.trim()) {
      setError('Please enter your name so your family knows who you are.');
      return;
    }

    setLoading(true);
    try {
      const user = await setDisplayName(displayName.trim(), familyId, token);
      const freshToken = user.token ?? token;

      if (intent === 'create') {
        router.replace({
          pathname: '/(auth)/share-code',
          params: {
            familyCode: familyCode!,
            familyName,
            token: freshToken,
            userId: user.id,
            displayName: user.displayName,
            familyId: user.familyId,
          },
        });
      } else {
        await signIn(freshToken, {
          id: user.id,
          displayName: user.displayName,
          familyId: user.familyId,
          familyName: user.familyName,
        });
      }
    } catch {
      setNetworkError('Something went wrong. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.heading}>What's your name?</Text>
        <Text style={styles.subtitle}>
          This is how your family will see you in {familyName}.
        </Text>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              style={[
                styles.input,
                inputFocused && { borderColor: colors.accent },
                error ? { borderColor: colors.destructive } : null,
              ]}
              value={displayName}
              onChangeText={(v) => { setDisplayNameState(v); if (error) setError(''); }}
              placeholder="e.g. Mum, Dad, Alex"
              placeholderTextColor={colors.textSecondary}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {networkError ? <Text style={styles.errorText}>{networkError}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Continue</Text>
            )}
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
    form: {
      gap: Spacing.md,
    },
    fieldGroup: {
      gap: Spacing.xs,
    },
    label: {
      ...Typography.label,
      color: colors.textSecondary,
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      ...Typography.body,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    errorText: {
      ...Typography.label,
      color: colors.destructive,
    },
    primaryButton: {
      backgroundColor: colors.accent,
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600' as const,
    },
  });
}
