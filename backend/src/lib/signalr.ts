import jwt from 'jsonwebtoken';

// Parse connection string or use individual env vars
function parseSignalRConfig() {
  const connStr = process.env.AZURE_SIGNALR_CONNECTION_STRING || '';
  if (connStr) {
    const endpointMatch = connStr.match(/Endpoint=(https?:\/\/[^;]+)/i);
    const keyMatch = connStr.match(/AccessKey=([^;]+)/i);
    return {
      endpoint: endpointMatch?.[1]?.replace(/\/$/, '') || '',
      accessKey: keyMatch?.[1] || '',
    };
  }
  return {
    endpoint: process.env.AZURE_SIGNALR_ENDPOINT || '',
    accessKey: process.env.AZURE_SIGNALR_ACCESS_KEY || '',
  };
}

const { endpoint, accessKey } = parseSignalRConfig();
const hub = 'familyhub';

function generateSignalRJwt(targetUrl: string): string {
  return jwt.sign({ aud: targetUrl }, accessKey, { expiresIn: 60 });
}

/** Generate negotiate response for client connection */
export function generateNegotiatePayload(userId: string): { url: string; accessToken: string } {
  const url = `${endpoint}/client/?hub=${hub}`;
  const token = jwt.sign(
    { aud: url, nameid: userId },
    accessKey,
    { expiresIn: 3600 }
  );
  return { url, accessToken: token };
}

/** Add a user to a SignalR group (= channel) */
export async function addUserToGroup(userId: string, groupName: string): Promise<void> {
  const url = `${endpoint}/api/v1/hubs/${hub}/groups/${groupName}/users/${userId}`;
  const token = generateSignalRJwt(url);
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 200 && res.status !== 204) {
    console.error(`Failed to add user ${userId} to group ${groupName}: ${res.status}`);
  }
}

/** Broadcast a message to all users in a channel group */
export async function broadcastToChannel(channelId: string, payload: object): Promise<void> {
  const url = `${endpoint}/api/v1/hubs/${hub}/groups/${channelId}`;
  const token = generateSignalRJwt(url);
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target: 'ReceiveMessage',
      arguments: [payload],
    }),
  });
}

/** Broadcast a reaction event to all users in a channel group */
export async function broadcastReaction(channelId: string, payload: object): Promise<void> {
  const url = `${endpoint}/api/v1/hubs/${hub}/groups/${channelId}`;
  const token = generateSignalRJwt(url);
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target: 'ReceiveReaction',
      arguments: [payload],
    }),
  });
}
