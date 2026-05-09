export type ApiError = { error: string };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    credentials: "include"
  });

  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message = (json as ApiError | null)?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}
