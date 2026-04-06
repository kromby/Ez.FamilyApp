import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useSession } from '../../stores/session';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';
import { fetchMemberLocations, MemberLocation } from '../../lib/api';
import { MemberLocationRow } from '../../components/location/MemberLocationRow';
import { LocationWarningBanner } from '../../components/location/LocationWarningBanner';

export default function LocationScreen() {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { session: token, user } = useSession();
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [permStatus, setPermStatus] = useState<string>('undetermined');

  useEffect(() => {
    navigation.setOptions({ title: 'Family locations' });
  }, [navigation]);

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) =>
      setPermStatus(status)
    );
  }, []);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['memberLocations', user?.familyId],
    queryFn: () => fetchMemberLocations(token!, user!.familyId),
    enabled: !!token && !!user?.familyId,
  });

  const currentMember = data?.members?.find((m) => m.userId === user?.id);
  const showToggleBanner = !!(currentMember && !currentMember.shareLocation);
  const showPermBanner = permStatus === 'denied' && currentMember?.shareLocation !== false;

  function handleRowPress(userId: string) {
    setExpandedUserId((prev) => (prev === userId ? null : userId));
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.md,
    },
    errorText: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Couldn't load locations. Pull to refresh.
        </Text>
      </View>
    );
  }

  const members: MemberLocation[] = data?.members ?? [];

  return (
    <View style={styles.container}>
      {showToggleBanner && <LocationWarningBanner type="toggle-off" />}
      {!showToggleBanner && showPermBanner && (
        <LocationWarningBanner type="permission-denied" />
      )}
      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => (
          <MemberLocationRow
            member={item}
            expanded={expandedUserId === item.userId}
            onPress={() => handleRowPress(item.userId)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
      />
    </View>
  );
}
