import type { Context, Next } from "hono";
import type { AppEnv } from "../types";

export async function errorHandler(
  c: Context<AppEnv>,
  next: Next,
): Promise<void> {
  try {
    await next();
  } catch (err) {
    console.error("Unhandled error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    c.status(500);
    c.json({ success: false, error: message });
  }
}
