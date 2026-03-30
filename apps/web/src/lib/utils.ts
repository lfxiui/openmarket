import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE = "/api";

export async function api<T>(
  path: string,
  options?: RequestInit,
): Promise<{ success: boolean; data?: T; error?: string }> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
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
