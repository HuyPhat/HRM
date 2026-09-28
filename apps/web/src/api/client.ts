const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export function getToken(): string | null {
  return localStorage.getItem('meridian_token');
}

export function setSession(token: string, user: unknown) {
  localStorage.setItem('meridian_token', token);
  localStorage.setItem('meridian_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('meridian_token');
  localStorage.removeItem('meridian_user');
}

export function getStoredUser<T>(): T | null {
  const raw = localStorage.getItem('meridian_user');
  return raw ? (JSON.parse(raw) as T) : null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? res.statusText, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function gqlFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });
  const body = await res.json();
  if (body.errors?.length) {
    throw new ApiError(body.errors[0].message, res.status);
  }
  return body.data as T;
}
