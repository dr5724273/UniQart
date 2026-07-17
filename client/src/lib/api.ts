export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type ApiError = { error: string };

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

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
    let message = (json as ApiError | null)?.error || `Request failed (${res.status})`;
    if (res.status === 401 && !path.includes("/api/auth/")) {
      message = "Session expired. Please login again.";
      if (typeof window !== "undefined") {
        if (window.location.pathname.startsWith("/admin")) {
          window.location.href = "/admin/login?expired=1";
        } else if (window.location.pathname.startsWith("/lister")) {
          window.location.href = "/auth/lister/sign-in?expired=1";
        } else if (window.location.pathname.startsWith("/buyer")) {
          window.location.href = "/auth/buyer/sign-in?expired=1";
        }
      }
    }
    throw new ApiRequestError(message, res.status);
  }
  return json as T;
}

export async function apiFetchFormData<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
    credentials: "include"
  });

  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    let message = (json as ApiError | null)?.error || `Request failed (${res.status})`;
    if (res.status === 401) {
      message = "Session expired. Please login again.";
      if (typeof window !== "undefined") {
        if (window.location.pathname.startsWith("/lister")) {
          window.location.href = "/auth/lister/sign-in?expired=1";
        } else if (window.location.pathname.startsWith("/buyer")) {
          window.location.href = "/auth/buyer/sign-in?expired=1";
        }
      }
    }
    throw new ApiRequestError(message, res.status);
  }
  return json as T;
}
