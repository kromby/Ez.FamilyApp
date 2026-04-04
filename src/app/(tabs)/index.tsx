import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from 'expo-router';
import { useSession } from '../../stores/session';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function HomeScreen() {
  const { user } = useSession();
  const navigation = useNavigation();
  const colors = useThemeColors();

  useEffect(() => {
    navigation.setOptions({ title: user?.familyName ?? 'Home' });
  }, [user?.familyName, navigation]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: Spacing.md,
    },
    avatarRow: {
      paddingVertical: Spacing.sm,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    avatarInitials: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
    },
    sectionHeading: {
      ...Typography.heading,
      color: colors.textPrimary,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    emptyText: {
      ...Typography.body,
      color: colors.textSecondary,
      marginTop: Spacing.sm,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.avatarRow}
      >
        {user && (
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>
              {getInitials(user.displayName)}
            </Text>
          </View>
        )}
      </ScrollView>

      <Text style={styles.sectionHeading}>Recent Activity</Text>
      <Text style={styles.emptyText}>
        No recent activity. Start by sending a message.
      </Text>
    </View>
  );
}
