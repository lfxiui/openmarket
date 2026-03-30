import { Hono } from "hono";
import type { AppEnv } from "../types";
import { requireAuth, hashApiKey } from "../middleware/auth";
import { apiKeyId } from "../lib/id";

export const keys = new Hono<AppEnv>();

/** Create a new API key */
keys.post("/", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const { name } = await c.req.json<{ name?: string }>();

  // Generate random key
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const randomPart = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const apiKey = `om_live_${randomPart}`;
  const keyPrefix = apiKey.slice(0, 16);
  const keyHash = await hashApiKey(apiKey);

  const id = apiKeyId();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO api_keys (id, owner_id, key_hash, key_prefix, name, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(id, ownerId, keyHash, keyPrefix, name || "default", now).run();

  // Return the full key ONCE
  return c.json({
    success: true,
    data: {
      id,
      apiKey,
      name: name || "default",
      keyPrefix,
      createdAt: now,
    },
  }, 201);
});

/** List API keys (prefix only) */
keys.get("/", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const rows = await c.env.DB.prepare(
    `SELECT id, key_prefix, name, last_used_at, created_at FROM api_keys WHERE owner_id = ? AND revoked = 0 ORDER BY created_at DESC`,
  ).bind(ownerId).all();

  return c.json({
    success: true,
    data: {
      keys: rows.results.map((r) => ({
        id: r.id,
        keyPrefix: r.key_prefix,
        name: r.name,
        lastUsedAt: r.last_used_at,
        createdAt: r.created_at,
      })),
    },
  });
});

/** Revoke an API key */
keys.delete("/:id", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const result = await c.env.DB.prepare(
    `UPDATE api_keys SET revoked = 1 WHERE id = ? AND owner_id = ?`,
  ).bind(id, ownerId).run();

  if (!result.meta.changes) {
    return c.json({ success: false, error: "Key not found" }, 404);
  }

  return c.json({ success: true });
});
