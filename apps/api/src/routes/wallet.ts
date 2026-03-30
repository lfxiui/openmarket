import { Hono } from "hono";
import type { AppEnv } from "../types";
import { requireAuth } from "../middleware/auth";
import { walletEventId } from "../lib/id";

export const wallet = new Hono<AppEnv>();

/** Get wallet balance */
wallet.get("/", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const row = await c.env.DB.prepare(
    `SELECT balance, frozen, total_earned, total_spent FROM wallets WHERE owner_id = ?`,
  ).bind(ownerId).first();

  if (!row) {
    return c.json({ success: false, error: "Wallet not found" }, 404);
  }

  return c.json({
    success: true,
    data: {
      balance: row.balance,
      frozen: row.frozen,
      totalEarned: row.total_earned,
      totalSpent: row.total_spent,
    },
  });
});

/** Top up wallet (v1: admin/manual seed) */
wallet.post("/topup", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const { amount } = await c.req.json<{ amount: number }>();
  if (!amount || amount < 1) {
    return c.json({ success: false, error: "Invalid amount" }, 400);
  }

  const now = new Date().toISOString();
  const w = await c.env.DB.prepare(
    `SELECT id, balance FROM wallets WHERE owner_id = ?`,
  ).bind(ownerId).first<{ id: string; balance: number }>();

  if (!w) {
    return c.json({ success: false, error: "Wallet not found" }, 404);
  }

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?`,
    ).bind(amount, now, w.id),
    c.env.DB.prepare(
      `INSERT INTO wallet_events (id, wallet_id, type, amount, balance_after, description, created_at)
       VALUES (?, ?, 'topup', ?, ?, 'Credits top-up', ?)`,
    ).bind(walletEventId(), w.id, amount, w.balance + amount, now),
  ]);

  return c.json({
    success: true,
    data: { balance: w.balance + amount },
  });
});

/** Wallet event history */
wallet.get("/history", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const page = Number.parseInt(c.req.query("page") || "1");
  const limit = Math.min(Number.parseInt(c.req.query("limit") || "50"), 100);
  const offset = (page - 1) * limit;

  const w = await c.env.DB.prepare(
    `SELECT id FROM wallets WHERE owner_id = ?`,
  ).bind(ownerId).first<{ id: string }>();

  if (!w) {
    return c.json({ success: false, error: "Wallet not found" }, 404);
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM wallet_events WHERE wallet_id = ?`,
  ).bind(w.id).first<{ total: number }>();

  const rows = await c.env.DB.prepare(
    `SELECT * FROM wallet_events WHERE wallet_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  ).bind(w.id, limit, offset).all();

  return c.json({
    success: true,
    data: {
      data: rows.results.map((r) => ({
        id: r.id,
        type: r.type,
        amount: r.amount,
        balanceAfter: r.balance_after,
        referenceId: r.reference_id,
        description: r.description,
        createdAt: r.created_at,
      })),
      total: countResult?.total || 0,
      page,
      limit,
    },
  });
});
