import type { Context, Next } from "hono";
import type { AppEnv } from "../types";

/**
 * Auth middleware that resolves either a session cookie or an API key.
 * Sets c.set("ownerId", ...) and c.set("authType", ...) on success.
 * Does NOT reject unauthenticated requests — route handlers decide.
 */
export async function authMiddleware(
  c: Context<AppEnv>,
  next: Next,
): Promise<void> {
  c.set("ownerId", null);
  c.set("authType", null);

  // Try API key first (for agent-to-agent calls)
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer om_live_")) {
    const key = authHeader.slice(7); // "Bearer ".length
    const keyHash = await hashApiKey(key);
    const row = await c.env.DB.prepare(
      `SELECT owner_id FROM api_keys WHERE key_hash = ? AND revoked = 0`,
    )
      .bind(keyHash)
      .first<{ owner_id: string }>();

    if (row) {
      c.set("ownerId", row.owner_id);
      c.set("authType", "apikey");
      // Update last_used_at (fire and forget)
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

  // Try session cookie
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
 * Route-level guard: returns 401 if not authenticated.
 */
export function requireAuth(c: Context<AppEnv>): string | null {
  const ownerId = c.get("ownerId");
  if (!ownerId) {
    return null;
  }
  return ownerId;
}

/**
 * Hash an API key or session token using SHA-256.
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getCookie(c: Context, name: string): string | undefined {
  const cookieHeader = c.req.header("Cookie");
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}
