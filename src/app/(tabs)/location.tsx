import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';

export default function LocationScreen() {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.md,
      backgroundColor: colors.background,
    },
    iconWrapper: {
      marginTop: Spacing['2xl'],
    },
    heading: {
      ...Typography.heading,
      color: colors.textPrimary,
      marginTop: Spacing.md,
    },
    body: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.sm,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
      </View>
      <Text style={styles.heading}>No location data yet</Text>
      <Text style={styles.body}>
        Location is shared automatically when family members send messages.
      </Text>
    </View>
  );
}
