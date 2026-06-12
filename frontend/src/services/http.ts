const API_BASE = "/api";

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(cb: (() => void) | null) {
  onUnauthorized = cb;
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    onUnauthorized?.();
    return null;
  }

  if (res.status === 204) return null;

  const text = await res.text();
  if (!text) return null;

  let data: T;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned HTML instead of JSON (status ${res.status}). Check if the backend is running.`,
    );
  }

  if (!res.ok) {
    throw new Error((data as any).detail || "Request failed");
  }

  return data;
}
