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
import { router } from 'expo-router';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';
import { requestOtp } from '../../api/client';

export default function CreateFamilyScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [familyNameError, setFamilyNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [networkError, setNetworkError] = useState('');
  const [loading, setLoading] = useState(false);
  const [familyNameFocused, setFamilyNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  async function handleSubmit() {
    setFamilyNameError('');
    setEmailError('');
    setNetworkError('');

    let valid = true;
    if (!familyName.trim()) {
      setFamilyNameError('Please enter a name for your family.');
      valid = false;
    }
    if (!email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      await requestOtp(email);
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email, intent: 'create', familyName: familyName.trim() },
      });
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
        <Text style={styles.heading}>Create a Family</Text>
        <Text style={styles.subtitle}>Give your family a name and enter your email to get started.</Text>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Family name</Text>
            <TextInput
              style={[
                styles.input,
                familyNameFocused && { borderColor: colors.accent },
                familyNameError ? { borderColor: colors.destructive } : null,
              ]}
              value={familyName}
              onChangeText={(v) => { setFamilyName(v); if (familyNameError) setFamilyNameError(''); }}
              placeholder="e.g. The Smiths"
              placeholderTextColor={colors.textSecondary}
              onFocus={() => setFamilyNameFocused(true)}
              onBlur={() => setFamilyNameFocused(false)}
              autoCapitalize="words"
              returnKeyType="next"
            />
            {familyNameError ? <Text style={styles.errorText}>{familyNameError}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Your email</Text>
            <TextInput
              style={[
                styles.input,
                emailFocused && { borderColor: colors.accent },
                emailError ? { borderColor: colors.destructive } : null,
              ]}
              value={email}
              onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(''); }}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
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
              <Text style={styles.primaryButtonText}>Create Family</Text>
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
      marginTop: Spacing.sm,
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
