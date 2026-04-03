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
import { verifyOtp, createFamily, joinFamily } from '../../api/client';

export default function VerifyOtpScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const { email, intent, familyName, familyCode } = useLocalSearchParams<{
    email: string;
    intent: 'create' | 'join';
    familyName?: string;
    familyCode?: string;
  }>();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  async function handleSubmit() {
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const { token } = await verifyOtp(email, otp);

      if (intent === 'create') {
        const { familyId, code } = await createFamily(familyName!, token);
        router.push({
          pathname: '/(auth)/set-name',
          params: {
            token,
            familyId,
            familyName: familyName!,
            intent: 'create',
            familyCode: code,
          },
        });
      } else {
        const { familyId, familyName: resolvedFamilyName } = await joinFamily(familyCode!);
        router.push({
          pathname: '/(auth)/set-name',
          params: {
            token,
            familyId,
            familyName: resolvedFamilyName,
            intent: 'join',
          },
        });
      }
    } catch {
      setError('Invalid or expired code. Please try again.');
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
        <Text style={styles.heading}>Check your email</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <TextInput
              style={[
                styles.input,
                inputFocused && { borderColor: colors.accent },
                error ? { borderColor: colors.destructive } : null,
              ]}
              value={otp}
              onChangeText={(v) => { setOtp(v); if (error) setError(''); }}
              placeholder="123456"
              placeholderTextColor={colors.textSecondary}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify Code</Text>
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
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      ...Typography.body,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      letterSpacing: 4,
      textAlign: 'center',
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
