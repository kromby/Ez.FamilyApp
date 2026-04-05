import React, { useState, useLayoutEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../../stores/session';
import { useThemeColors, Spacing, Typography } from '../../../constants/theme';
import { fetchChannels, createChannel } from '../../../lib/api';
import type { Channel } from '../../../lib/api';
import { ChannelListItem } from '../../../components/messages/ChannelListItem';

export default function ChannelListScreen() {
  const { session: token } = useSession();
  const colors = useThemeColors();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [validationError, setValidationError] = useState('');

  // Header right plus button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setModalVisible(true)}
          style={{ paddingRight: Spacing.md }}
          hitSlop={8}
        >
          <Ionicons name="add-outline" size={24} color={colors.accent} />
        </Pressable>
      ),
    });
  }, [navigation, colors.accent]);

  // Fetch channels
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['channels'],
    queryFn: () => fetchChannels(token!),
    enabled: !!token,
  });

  const channels = data?.channels || [];

  // Create channel mutation
  const createMutation = useMutation({
    mutationFn: (name: string) => createChannel(token!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setModalVisible(false);
      setChannelName('');
      setValidationError('');
    },
  });

  const validPattern = /^[a-zA-Z0-9 \-]{1,50}$/;

  const handleCreateChannel = useCallback(() => {
    const trimmed = channelName.trim();
    if (!validPattern.test(trimmed)) {
      setValidationError('Channel name must be 1\u201350 characters. Letters, numbers, spaces, and hyphens only.');
      return;
    }
    setValidationError('');
    createMutation.mutate(trimmed);
  }, [channelName, createMutation]);

  const isValid = channelName.trim().length > 0 && validPattern.test(channelName.trim());

  const renderItem = useCallback(({ item }: { item: Channel }) => (
    <ChannelListItem
      channel={item}
      onPress={() => router.push(`/messages/${item.id}`)}
    />
  ), [router]);

  // Empty state (defensive per UI-SPEC — should not occur after D-03)
  if (!isLoading && channels.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
        <Text style={[Typography.heading, { color: colors.textPrimary, marginTop: Spacing.md }]}>
          No channels yet
        </Text>
        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>
          Something went wrong. Pull down to refresh.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: Spacing['2xl'] }} color={colors.accent} />
      ) : (
        <FlashList
          data={channels}
          renderItem={renderItem}
          estimatedItemSize={64}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
          }
        />
      )}

      {/* Create Channel Modal — per UI-SPEC modal section */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboard}
          >
            <Pressable
              style={[styles.modalPanel, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => {}} // prevent dismiss when tapping panel
            >
              <Text style={[Typography.heading, { color: colors.textPrimary }]}>
                New Channel
              </Text>

              <TextInput
                style={[
                  styles.modalInput,
                  Typography.body,
                  {
                    color: colors.textPrimary,
                    borderColor: validationError ? colors.destructive : colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="e.g. weekend-plans"
                placeholderTextColor={colors.textSecondary}
                value={channelName}
                onChangeText={(t) => { setChannelName(t); setValidationError(''); }}
                maxLength={50}
                autoFocus
              />

              {!!validationError && (
                <Text style={[Typography.label, { color: colors.destructive, marginTop: Spacing.xs }]}>
                  {validationError}
                </Text>
              )}

              {!!createMutation.error && (
                <Text style={[Typography.label, { color: colors.destructive, marginTop: Spacing.xs }]}>
                  {(createMutation.error as Error).message}
                </Text>
              )}

              <Pressable
                onPress={handleCreateChannel}
                disabled={!isValid || createMutation.isPending}
                style={[
                  styles.modalConfirm,
                  {
                    backgroundColor: isValid && !createMutation.isPending ? colors.accent : colors.surface,
                    marginTop: Spacing.md,
                  },
                ]}
              >
                <Text style={[
                  Typography.heading,
                  {
                    color: isValid && !createMutation.isPending ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: '700',
                    textAlign: 'center',
                  },
                ]}>
                  Create Channel
                </Text>
              </Pressable>

              <Pressable
                onPress={() => { setModalVisible(false); setChannelName(''); setValidationError(''); }}
                style={{ marginTop: Spacing.md, alignSelf: 'center' }}
              >
                <Text style={[Typography.label, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalKeyboard: {
    justifyContent: 'flex-end',
  },
  modalPanel: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: Spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  modalConfirm: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
