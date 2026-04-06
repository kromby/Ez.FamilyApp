import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform, Switch } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../stores/session';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';
import { updateShareLocation, fetchMemberLocations } from '../../lib/api';

export default function ProfileScreen() {
  const { user, signOut, session: token } = useSession();
  const colors = useThemeColors();
  const queryClient = useQueryClient();

  const { data: locData } = useQuery({
    queryKey: ['memberLocations', user?.familyId],
    queryFn: () => fetchMemberLocations(token!, user!.familyId),
    enabled: !!token && !!user?.familyId,
  });

  const currentMember = locData?.members?.find((m) => m.userId === user?.id);
  const [shareLocation, setShareLocation] = useState(true);

  useEffect(() => {
    if (currentMember !== undefined) {
      setShareLocation(currentMember.shareLocation);
    }
  }, [currentMember]);

  const toggleMutation = useMutation({
    mutationFn: (val: boolean) => updateShareLocation(token!, val),
    onMutate: (val) => setShareLocation(val),
    onError: () => setShareLocation((prev) => !prev),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['memberLocations'] }),
  });

  const handleToggleShareLocation = (val: boolean) => toggleMutation.mutate(val);

  function handleSignOut() {
    if (Platform.OS === 'web') {
      if (window.confirm("Sign Out? You'll need your family code to rejoin.")) {
        signOut();
      }
    } else {
      Alert.alert(
        'Sign Out?',
        "You'll need your family code to rejoin.",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
        ]
      );
    }
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
    sectionHeader: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xs,
    },
    sectionHeaderText: {
      ...Typography.label,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    toggleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      minHeight: 52,
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

      {/* Privacy section — per D-14 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>PRIVACY</Text>
      </View>
      <View style={[styles.row, styles.toggleRow]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowValue}>Share location</Text>
          <Text style={styles.rowLabel}>
            Family can see where you last were when you send a message
          </Text>
        </View>
        <Switch
          value={shareLocation}
          onValueChange={handleToggleShareLocation}
          trackColor={{ true: colors.accent, false: colors.border }}
          accessibilityLabel="Share location toggle"
        />
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
