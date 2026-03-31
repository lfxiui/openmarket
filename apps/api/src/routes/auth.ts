import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import type { AppEnv } from "../types";
import { hashApiKey } from "../middleware/auth";
import { ownerId, walletId, sessionId } from "../lib/id";

export const auth = new Hono<AppEnv>();

auth.post("/register", async (c) => {
  const { email, password, displayName } = await c.req.json<{
    email: string;
    password: string;
    displayName: string;
  }>();

  if (!email || !password || !displayName) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ success: false, error: "Invalid email format" }, 400);
  }
  if (password.length < 8) {
    return c.json(
      { success: false, error: "Password must be at least 8 characters" },
      400,
    );
  }
  if (displayName.length < 2 || displayName.length > 50) {
    return c.json(
      { success: false, error: "Display name must be 2-50 characters" },
      400,
    );
  }

  const existing = await c.env.DB.prepare(
    `SELECT id FROM owners WHERE email = ?`,
  )
    .bind(email.toLowerCase())
    .first();
  if (existing) {
    return c.json({ success: false, error: "Email already registered" }, 409);
  }

  const passwordHash = await hashPassword(password);
  const id = ownerId();
  const wId = walletId();
  const now = new Date().toISOString();

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO owners (id, email, display_name, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(id, email.toLowerCase(), displayName, passwordHash, now, now),
    c.env.DB.prepare(
      `INSERT INTO wallets (id, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
    ).bind(wId, id, now, now),
  ]);

  const { token, tokenHash, expiresAt } = await createSessionToken();
  const sId = sessionId();
  await c.env.DB.prepare(
    `INSERT INTO sessions (id, owner_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(sId, id, tokenHash, expiresAt, now).run();

  setSessionCookie(c, token, new Date(expiresAt));

  return c.json({
    success: true,
    data: {
      owner: { id, email: email.toLowerCase(), displayName, verified: false },
      token,
    },
  });
});

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json<{
    email: string;
    password: string;
  }>();

  if (!email || !password) {
    return c.json({ success: false, error: "Missing credentials" }, 400);
  }

  const owner = await c.env.DB.prepare(
    `SELECT id, email, display_name, password_hash, avatar_url, verified FROM owners WHERE email = ?`,
  )
    .bind(email.toLowerCase())
    .first<{
      id: string;
      email: string;
      display_name: string;
      password_hash: string;
      avatar_url: string | null;
      verified: number;
    }>();

  if (!owner || !(await verifyPassword(password, owner.password_hash))) {
    return c.json({ success: false, error: "Invalid credentials" }, 401);
  }

  const { token, tokenHash, expiresAt } = await createSessionToken();
  const sId = sessionId();
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `INSERT INTO sessions (id, owner_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(sId, owner.id, tokenHash, expiresAt, now).run();

  setSessionCookie(c, token, new Date(expiresAt));

  return c.json({
    success: true,
    data: {
      owner: {
        id: owner.id,
        email: owner.email,
        displayName: owner.display_name,
        avatarUrl: owner.avatar_url,
        verified: owner.verified === 1,
      },
      token,
    },
  });
});

auth.post("/logout", async (c) => {
  const sessionToken = getCookie(c, "session");
  if (sessionToken) {
    const tokenHash = await hashApiKey(sessionToken);
    await c.env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`)
      .bind(tokenHash)
      .run();
  }
  deleteCookie(c, "session", { path: "/" });
  return c.json({ success: true });
});

auth.get("/me", async (c) => {
  const ownerId = c.get("ownerId");
  if (!ownerId) {
    return c.json({ success: false, error: "Not authenticated" }, 401);
  }

  const owner = await c.env.DB.prepare(
    `SELECT id, email, display_name, avatar_url, verified, created_at FROM owners WHERE id = ?`,
  )
    .bind(ownerId)
    .first<{
      id: string;
      email: string;
      display_name: string;
      avatar_url: string | null;
      verified: number;
      created_at: string;
    }>();

  if (!owner) {
    return c.json({ success: false, error: "Owner not found" }, 404);
  }

  return c.json({
    success: true,
    data: {
      owner: {
        id: owner.id,
        email: owner.email,
        displayName: owner.display_name,
        avatarUrl: owner.avatar_url,
        verified: owner.verified === 1,
        createdAt: owner.created_at,
      },
    },
  });
});

// ============================================================
// Helpers
// ============================================================

function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string, expires: Date) {
  setCookie(c, "session", token, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    expires,
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256,
  );
  const hashHex = Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, expectedHash] = stored.split(":");
  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256,
  );
  const hashHex = Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex === expectedHash;
}

async function createSessionToken(): Promise<{
  token: string;
  tokenHash: string;
  expiresAt: string;
}> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const tokenHash = await hashApiKey(token);
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  return { token, tokenHash, expiresAt };
}
