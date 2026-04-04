import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useSession } from '../../stores/session';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, signOut } = useSession();
  const colors = useThemeColors();

  function handleSignOut() {
    Alert.alert(
      'Sign Out?',
      "You'll need your family code to rejoin.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    row: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    rowLabel: {
      ...Typography.label,
      color: colors.textSecondary,
    },
    rowValue: {
      ...Typography.body,
      color: colors.textPrimary,
    },
    signOutButton: {
      marginTop: 'auto' as const,
      padding: Spacing.md,
    },
    signOutText: {
      fontSize: Typography.body.fontSize,
      fontWeight: Typography.body.fontWeight,
      lineHeight: Typography.body.lineHeight,
      color: colors.destructive,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Display name</Text>
        <Text style={styles.rowValue}>{user?.displayName ?? ''}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Family</Text>
        <Text style={styles.rowValue}>{user?.familyName ?? ''}</Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
