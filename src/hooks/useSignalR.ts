import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '../stores/session';
import { useMessagingStore } from '../stores/messaging';
import { negotiateSignalR, joinSignalRChannels, Message } from '../lib/api';

export function useSignalR() {
  const { session: token } = useSession();
  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null);
  const setConnectionStatus = useMessagingStore((s) => s.setConnectionStatus);

  const joinChannels = useCallback(async () => {
    if (!token) return;
    try {
      await joinSignalRChannels(token);
    } catch (err) {
      console.error('Failed to join SignalR channels:', err);
    }
  }, [token]);

  // Handle incoming message: update query cache directly (no polling)
  const handleReceiveMessage = useCallback((message: Message) => {
    // Update messages query for this channel
    queryClient.setQueryData(
      ['messages', message.channelId],
      (old: any) => {
        if (!old?.pages) return old;
        // Append to the first page (newest messages)
        const firstPage = old.pages[0];
        // Skip if message already exists (dedup with optimistic)
        const exists = firstPage.messages.some(
          (m: Message) => m.id === message.id || (m.id.startsWith('temp-') && m.senderId === message.senderId && m.text === message.text)
        );
        if (exists) {
          // Replace temp message with real one
          return {
            ...old,
            pages: old.pages.map((page: any, idx: number) => {
              if (idx !== 0) return page;
              return {
                ...page,
                messages: page.messages.map((m: Message) =>
                  m.id.startsWith('temp-') && m.senderId === message.senderId && m.text === message.text
                    ? { ...message, status: 'sent' }
                    : m
                ),
              };
            }),
          };
        }
        return {
          ...old,
          pages: [
            { ...firstPage, messages: [message, ...firstPage.messages] },
            ...old.pages.slice(1),
          ],
        };
      }
    );

    // Also invalidate channel list to update last message preview
    queryClient.invalidateQueries({ queryKey: ['channels'] });
  }, [queryClient]);

  const handleReceiveReaction = useCallback((payload: { channelId: string; messageId: string; reactions: any[] }) => {
    queryClient.setQueryData(
      ['messages', payload.channelId],
      (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((m: Message) =>
              m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m
            ),
          })),
        };
      }
    );
  }, [queryClient]);

  useEffect(() => {
    if (!token) return;

    let connection: HubConnection;

    async function connect() {
      try {
        setConnectionStatus('connecting');

        // Get negotiate payload from our API
        const { url, accessToken } = await negotiateSignalR(token!);

        connection = new HubConnectionBuilder()
          .withUrl(url, { accessTokenFactory: () => accessToken })
          .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
          .configureLogging(LogLevel.Warning)
          .build();

        // Register event handlers
        connection.on('ReceiveMessage', handleReceiveMessage);
        connection.on('ReceiveReaction', handleReceiveReaction);

        connection.onreconnecting(() => setConnectionStatus('reconnecting'));
        connection.onreconnected(async () => {
          setConnectionStatus('connected');
          await joinChannels();
        });
        connection.onclose(() => setConnectionStatus('disconnected'));

        await connection.start();
        connectionRef.current = connection;
        setConnectionStatus('connected');

        // Join all family channel groups
        await joinChannels();
      } catch (err) {
        console.error('SignalR connection failed:', err);
        setConnectionStatus('disconnected');
      }
    }

    connect();

    // Pitfall 1: Reconnect on app foreground
    const appStateSubscription = AppState.addEventListener(
      'change',
      async (nextState: AppStateStatus) => {
        if (
          nextState === 'active' &&
          connectionRef.current?.state === HubConnectionState.Disconnected
        ) {
          try {
            setConnectionStatus('reconnecting');
            await connectionRef.current.start();
            setConnectionStatus('connected');
            await joinChannels();
          } catch (err) {
            console.error('SignalR foreground reconnect failed:', err);
            setConnectionStatus('disconnected');
          }
        }
      }
    );

    return () => {
      appStateSubscription.remove();
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [token, handleReceiveMessage, handleReceiveReaction, joinChannels, setConnectionStatus]);

  return { connectionRef };
}
