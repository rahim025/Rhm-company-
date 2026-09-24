// Petit client HTTP pour parler à l'API RHM Base depuis le dashboard.
// Le token JWT est stocké en mémoire + localStorage côté client.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("rhm_token");
}

export function setToken(token: string) {
  window.localStorage.setItem("rhm_token", token);
}

export function clearToken() {
  window.localStorage.removeItem("rhm_token");
}

export async function api<T = any>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Erreur ${res.status}`);
  }
  return data as T;
}

export { API_URL };
