import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../../stores/session';
import { useThemeColors, Spacing, Typography } from '../../../constants/theme';
import { fetchMessages, sendMessage, toggleReaction, Message } from '../../../lib/api';
import { useMessagingStore } from '../../../stores/messaging';
import { useSignalR } from '../../../hooks/useSignalR';
import { MessageBubble } from '../../../components/messages/MessageBubble';
import { MessageInput } from '../../../components/messages/MessageInput';
import { ReactionPicker } from '../../../components/messages/ReactionPicker';
import { ReactionChips } from '../../../components/messages/ReactionChips';

const GROUPING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes per UI-SPEC

export default function MessageThreadScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { session: token, user } = useSession();
  const colors = useThemeColors();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const connectionStatus = useMessagingStore((s) => s.connectionStatus);
  const [pickerMessageId, setPickerMessageId] = useState<string | null>(null);

  // Initialize SignalR connection (singleton — will connect once per session)
  useSignalR();

  // Set header title to #channelName
  // We'll get the channel name from the channel list cache or fallback to ID
  const channelData = queryClient.getQueryData<{ channels: any[] }>(['channels']);
  const channel = channelData?.channels?.find((c: any) => c.id === channelId);
  const channelName = channel?.name || 'channel';

  useLayoutEffect(() => {
    navigation.setOptions({ title: `#${channelName}` });
  }, [navigation, channelName]);

  // Fetch message history with cursor pagination (D-11)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: ({ pageParam }) => fetchMessages(token!, channelId!, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!token && !!channelId,
  });

  const listRef = useRef<FlashList<Message>>(null);

  // Flatten pages into single message array, reversed to oldest-first for non-inverted list
  const messages = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap((page) => page.messages);
    return [...all].reverse(); // oldest first
  }, [data]);

  // Auto-scroll to bottom when new messages arrive
  const prevMessageCount = useRef(0);
  useMemo(() => {
    if (messages.length > prevMessageCount.current && prevMessageCount.current > 0) {
      // New message added — scroll to end after render
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  // Determine sender grouping (oldest-first: previous message is index-1)
  const getIsFirstInGroup = useCallback((index: number): boolean => {
    if (index === 0) return true; // first message = always show name
    const current = messages[index];
    const previous = messages[index - 1];
    if (!previous) return true;
    if (current.senderId !== previous.senderId) return true;
    const currentTime = new Date(current.createdAt).getTime();
    const previousTime = new Date(previous.createdAt).getTime();
    return Math.abs(currentTime - previousTime) > GROUPING_THRESHOLD_MS;
  }, [messages]);

  // Silently grab GPS coordinates for location capture (LOC-01, D-10)
  const getCoords = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Location.getLastKnownPositionAsync() ??
        await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return loc ? { latitude: loc.coords.latitude, longitude: loc.coords.longitude } : null;
    } catch {
      return null; // silent fallback — message sends without location (D-08)
    }
  }, []);

  // Send message mutation with optimistic update (D-10, Pitfall 3 from RESEARCH.md)
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const coords = await getCoords();
      return sendMessage(token!, channelId!, text, coords);
    },
    onMutate: async (text) => {
      if (!user) return;
      await queryClient.cancelQueries({ queryKey: ['messages', channelId] });
      const previousData = queryClient.getQueryData(['messages', channelId]);

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        channelId: channelId!,
        senderId: user.id,
        senderName: user.displayName,
        text,
        createdAt: new Date().toISOString(),
        reactions: [],
        status: 'sending',
      };

      queryClient.setQueryData(['messages', channelId], (old: any) => {
        if (!old?.pages?.length) {
          return { pages: [{ messages: [optimisticMessage], nextCursor: null, hasMore: false }], pageParams: [null] };
        }
        return {
          ...old,
          pages: [
            { ...old.pages[0], messages: [optimisticMessage, ...old.pages[0].messages] },
            ...old.pages.slice(1),
          ],
        };
      });

      return { previousData };
    },
    onError: (_err, _text, context) => {
      // Mark as error instead of rolling back (so user sees the failed message)
      queryClient.setQueryData(['messages', channelId], (old: any) => {
        if (!old?.pages) return context?.previousData;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((m: Message) =>
              m.id.startsWith('temp-') ? { ...m, status: 'error' as const } : m
            ),
          })),
        };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  const handleSend = useCallback((text: string) => {
    sendMutation.mutate(text);
  }, [sendMutation]);

  const handleToggleReaction = useCallback(async (messageId: string, emoji: string) => {
    setPickerMessageId(null);
    try {
      const result = await toggleReaction(token!, messageId, emoji);
      // Cache will be updated via SignalR ReceiveReaction event
      // But also update locally for immediate feedback
      queryClient.setQueryData(['messages', channelId], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((m: Message) =>
              m.id === messageId ? { ...m, reactions: result.reactions } : m
            ),
          })),
        };
      });
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  }, [token, channelId, queryClient]);

  const renderItem = useCallback(({ item, index }: { item: Message; index: number }) => (
    <MessageBubble
      message={item}
      isFirstInGroup={getIsFirstInGroup(index)}
      onLongPress={() => setPickerMessageId(item.id)}
    >
      <ReactionChips
        reactions={item.reactions || []}
        currentUserId={user?.id ?? ''}
        onToggle={(emoji) => handleToggleReaction(item.id, emoji)}
      />
    </MessageBubble>
  ), [getIsFirstInGroup, user, handleToggleReaction]);

  // Load more on scroll to top (infinite scroll upward)
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Connection status banner */}
      {(connectionStatus === 'reconnecting' || connectionStatus === 'disconnected') && (
        <View style={[styles.statusBanner, { backgroundColor: colors.surface }]}>
          <Text style={[Typography.label, { color: colors.textSecondary, textAlign: 'center' }]}>
            Reconnecting...
          </Text>
        </View>
      )}

      {/* Message list */}
      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
          <Text style={[Typography.heading, { color: colors.textPrimary, marginTop: Spacing.md, textAlign: 'center' }]}>
            Start the conversation
          </Text>
          <Text style={[Typography.body, { color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }]}>
            Send the first message in #{channelName}.
          </Text>
        </View>
      ) : (
        <FlashList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          estimatedItemSize={60}
          keyExtractor={(item) => item.id}
          onStartReached={handleEndReached}
          onStartReachedThreshold={0.5}
          ListHeaderComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={{ padding: Spacing.md }} color={colors.accent} size="small" />
            ) : null
          }
          onContentSizeChange={() => {
            // Scroll to bottom on initial load
            if (messages.length > 0 && prevMessageCount.current <= messages.length) {
              listRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />
      )}

      {/* Message input */}
      <MessageInput channelName={channelName} onSend={handleSend} />

      {/* Reaction picker (long-press trigger) */}
      <ReactionPicker
        visible={!!pickerMessageId}
        onSelect={(emoji) => pickerMessageId && handleToggleReaction(pickerMessageId, emoji)}
        onDismiss={() => setPickerMessageId(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusBanner: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
});
