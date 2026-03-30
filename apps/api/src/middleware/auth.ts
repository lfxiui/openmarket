import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import type { AppEnv } from "../types";

/**
 * Auth middleware: resolves session from cookie, Bearer token, or API key.
 * Sets c.set("ownerId", ...) and c.set("authType", ...) on success.
 */
export async function authMiddleware(
  c: Context<AppEnv>,
  next: Next,
): Promise<void> {
  c.set("ownerId", null);
  c.set("authType", null);

  const authHeader = c.req.header("Authorization");

  // API key auth: Bearer om_live_...
  if (authHeader?.startsWith("Bearer om_live_")) {
    const key = authHeader.slice(7);
    const keyHash = await hashApiKey(key);
    const row = await c.env.DB.prepare(
      `SELECT owner_id FROM api_keys WHERE key_hash = ? AND revoked = 0`,
    )
      .bind(keyHash)
      .first<{ owner_id: string }>();

    if (row) {
      c.set("ownerId", row.owner_id);
      c.set("authType", "apikey");
      c.executionCtx.waitUntil(
        c.env.DB.prepare(
          `UPDATE api_keys SET last_used_at = datetime('now') WHERE key_hash = ?`,
        )
          .bind(keyHash)
          .run(),
      );
    }
    return next();
  }

  // Session token auth: Bearer <session_token> (fallback for proxy issues)
  if (authHeader?.startsWith("Bearer ") && !authHeader.startsWith("Bearer om_live_")) {
    const token = authHeader.slice(7);
    const tokenHash = await hashApiKey(token);
    const row = await c.env.DB.prepare(
      `SELECT owner_id FROM sessions WHERE token_hash = ? AND expires_at > datetime('now')`,
    )
      .bind(tokenHash)
      .first<{ owner_id: string }>();

    if (row) {
      c.set("ownerId", row.owner_id);
      c.set("authType", "session");
    }
    return next();
  }

  // Cookie auth
  const sessionToken = getCookie(c, "session");
  if (sessionToken) {
    const tokenHash = await hashApiKey(sessionToken);
    const row = await c.env.DB.prepare(
      `SELECT owner_id FROM sessions WHERE token_hash = ? AND expires_at > datetime('now')`,
    )
      .bind(tokenHash)
      .first<{ owner_id: string }>();

    if (row) {
      c.set("ownerId", row.owner_id);
      c.set("authType", "session");
    }
  }

  return next();
}

/**
 * Route-level guard: returns ownerId or null if not authenticated.
 */
export function requireAuth(c: Context<AppEnv>): string | null {
  return c.get("ownerId");
}

/**
 * Hash using SHA-256 (for API keys and session tokens).
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
