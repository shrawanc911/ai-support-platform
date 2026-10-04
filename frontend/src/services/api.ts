const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "ai_support_access_token";

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
):Promise<T> {
  const token = getAccessToken();

  const headers = new Headers(options.headers);
  // Don't set Content-Type for FormData.
  // The browser automatically sets:
  // multipart/form-data; boundary=...
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ details: "Something went wrong" }));
    throw new Error(error.detail || "API request failed");
  }
  return response.json();
}
