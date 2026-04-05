const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function apiFetch(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

// Channel types
export interface Channel {
  id: string;
  name: string;
  lastMessageAt: string | null;
  lastMessageText: string | null;
  createdAt: string;
}

// Message types
export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  reactions?: ReactionGroup[];
  status?: 'sending' | 'sent' | 'error';
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface MessagesPage {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Channel API
export async function fetchChannels(token: string): Promise<{ channels: Channel[] }> {
  return apiFetch('/channels', token);
}

export async function createChannel(token: string, name: string): Promise<{ channel: Channel }> {
  return apiFetch('/channels', token, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

// Message API
export async function fetchMessages(
  token: string,
  channelId: string,
  cursor?: string | null,
  limit = 30
): Promise<MessagesPage> {
  const params = new URLSearchParams({ channelId, limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return apiFetch(`/messages?${params}`, token);
}

export async function sendMessage(
  token: string,
  channelId: string,
  text: string
): Promise<{ message: Message }> {
  return apiFetch('/messages', token, {
    method: 'POST',
    body: JSON.stringify({ channelId, text }),
  });
}

// Reaction API
export async function toggleReaction(
  token: string,
  messageId: string,
  emoji: string
): Promise<{ action: 'added' | 'removed'; reactions: ReactionGroup[] }> {
  return apiFetch(`/messages/${messageId}/reactions`, token, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });
}

// SignalR API
export async function negotiateSignalR(
  token: string
): Promise<{ url: string; accessToken: string }> {
  return apiFetch('/signalr/negotiate', token, { method: 'POST' });
}

export async function joinSignalRChannels(token: string): Promise<{ joined: number }> {
  return apiFetch('/signalr/join-channels', token, { method: 'POST' });
}
