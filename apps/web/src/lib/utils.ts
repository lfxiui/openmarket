import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE =
  import.meta.env.VITE_API_URL || "/api";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("session_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function api<T>(
  path: string,
  options?: RequestInit,
): Promise<{ success: boolean; data?: T; error?: string }> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: getAuthHeaders(),
    credentials: "include",
    ...options,
  });
  return res.json();
}

export async function apiPost<T>(
  path: string,
  body: unknown,
): Promise<{ success: boolean; data?: T; error?: string }> {
  return api<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function saveSession(token: string) {
  localStorage.setItem("session_token", token);
}

export function clearSession() {
  localStorage.removeItem("session_token");
}

export function hasSession(): boolean {
  return !!localStorage.getItem("session_token");
}
