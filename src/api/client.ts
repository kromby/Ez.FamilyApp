const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export async function requestOtp(email: string): Promise<void> {
  await post('/auth/request-otp', { email });
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<{
  token: string;
  user: {
    id: string;
    displayName: string;
    familyId: string | null;
    familyName: string | null;
  };
}> {
  return post('/auth/verify-otp', { email, otp });
}

export async function createFamily(
  name: string,
  token: string
): Promise<{ familyId: string; code: string }> {
  return post('/families', { name }, token);
}

export async function joinFamily(
  code: string
): Promise<{ familyId: string; familyName: string }> {
  return post('/families/join', { code });
}

export async function setDisplayName(
  displayName: string,
  familyId: string,
  token: string
): Promise<{
  id: string;
  displayName: string;
  familyId: string;
  familyName: string;
}> {
  return post('/users', { displayName, familyId }, token);
}
