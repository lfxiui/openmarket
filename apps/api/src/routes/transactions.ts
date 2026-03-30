import { Hono } from "hono";
import type { AppEnv } from "../types";
import { requireAuth } from "../middleware/auth";
import { transactionId, transactionEventId, reviewId } from "../lib/id";
import { freezeCredits, releaseCredits, refundCredits } from "../lib/credits";
import { DEFAULT_TTL_HOURS, COMMISSION_RATE } from "@openmarket/shared";

export const transactions = new Hono<AppEnv>();

/** Create a transaction (escrow) — buyer agent */
transactions.post("/", async (c) => {
  const buyerOwnerId = requireAuth(c);
  if (!buyerOwnerId)
    return c.json({ success: false, error: "Unauthorized" }, 401);

  const body = await c.req.json<{
    agentId: string;
    amount: number;
    description?: string;
    metadata?: Record<string, unknown>;
    ttlHours?: number;
  }>();

  if (!body.agentId || !body.amount || body.amount < 1) {
    return c.json(
      { success: false, error: "agentId and amount required" },
      400,
    );
  }

  // Get agent and its owner
  const agent = await c.env.DB.prepare(
    `SELECT id, owner_id, status FROM agents WHERE id = ? AND status = 'listed'`,
  )
    .bind(body.agentId)
    .first<{ id: string; owner_id: string; status: string }>();

  if (!agent) {
    return c.json(
      { success: false, error: "Agent not found or not listed" },
      404,
    );
  }

  if (agent.owner_id === buyerOwnerId) {
    return c.json(
      { success: false, error: "Cannot hire your own agent" },
      400,
    );
  }

  // Check buyer has enough credits
  const buyerWallet = await c.env.DB.prepare(
    `SELECT id, balance FROM wallets WHERE owner_id = ?`,
  )
    .bind(buyerOwnerId)
    .first<{ id: string; balance: number }>();

  if (!buyerWallet || buyerWallet.balance < body.amount) {
    return c.json({ success: false, error: "Insufficient credits" }, 400);
  }

  const txId = transactionId();
  const ttl = body.ttlHours || DEFAULT_TTL_HOURS;
  const expiresAt = new Date(
    Date.now() + ttl * 60 * 60 * 1000,
  ).toISOString();
  const now = new Date().toISOString();

  // Freeze credits and create transaction
  await freezeCredits(c.env.DB, buyerWallet.id, body.amount, txId);

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO transactions (id, buyer_owner_id, seller_owner_id, agent_id, amount, status, description, metadata, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'escrowed', ?, ?, ?, ?, ?)`,
    ).bind(
      txId,
      buyerOwnerId,
      agent.owner_id,
      body.agentId,
      body.amount,
      body.description || null,
      body.metadata ? JSON.stringify(body.metadata) : null,
      expiresAt,
      now,
      now,
    ),
    c.env.DB.prepare(
      `INSERT INTO transaction_events (id, transaction_id, event_type, actor_type, actor_id, created_at)
       VALUES (?, ?, 'created', 'buyer', ?, ?)`,
    ).bind(transactionEventId(), txId, buyerOwnerId, now),
  ]);

  return c.json(
    {
      success: true,
      data: {
        transaction: {
          id: txId,
          agentId: body.agentId,
          amount: body.amount,
          status: "escrowed",
          expiresAt,
          createdAt: now,
        },
      },
    },
    201,
  );
});

/** Get transaction by ID — buyer or seller */
transactions.get("/:id", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId)
    return c.json({ success: false, error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const tx = await c.env.DB.prepare(`SELECT * FROM transactions WHERE id = ?`)
    .bind(id)
    .first();

  if (
    !tx ||
    (tx.buyer_owner_id !== ownerId && tx.seller_owner_id !== ownerId)
  ) {
    return c.json({ success: false, error: "Transaction not found" }, 404);
  }

  return c.json({ success: true, data: { transaction: rowToTransaction(tx) } });
});

/** List transactions — buyer or seller */
transactions.get("/", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId)
    return c.json({ success: false, error: "Unauthorized" }, 401);

  const role = c.req.query("role") || "buyer";
  const status = c.req.query("status");
  const page = Number.parseInt(c.req.query("page") || "1");
  const limit = Math.min(Number.parseInt(c.req.query("limit") || "50"), 100);
  const offset = (page - 1) * limit;

  const col = role === "seller" ? "seller_owner_id" : "buyer_owner_id";
  let where = `WHERE ${col} = ?`;
  const params: unknown[] = [ownerId];

  if (status) {
    where += " AND status = ?";
    params.push(status);
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM transactions ${where}`,
  )
    .bind(...params)
    .first<{ total: number }>();

  const rows = await c.env.DB.prepare(
    `SELECT * FROM transactions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(...params, limit, offset)
    .all();

  return c.json({
    success: true,
    data: {
      data: rows.results.map(rowToTransaction),
      total: countResult?.total || 0,
      page,
      limit,
    },
  });
});

/** Seller marks delivery */
transactions.post("/:id/deliver", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId)
    return c.json({ success: false, error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const now = new Date().toISOString();

  const result = await c.env.DB.prepare(
    `UPDATE transactions SET status = 'delivered', delivered_at = ?, updated_at = ? WHERE id = ? AND seller_owner_id = ? AND status = 'escrowed'`,
  )
    .bind(now, now, id, ownerId)
    .run();

  if (!result.meta.changes) {
    return c.json({ success: false, error: "Cannot deliver" }, 400);
  }

  await c.env.DB.prepare(
    `INSERT INTO transaction_events (id, transaction_id, event_type, actor_type, actor_id, created_at)
     VALUES (?, ?, 'delivered', 'seller', ?, ?)`,
  )
    .bind(transactionEventId(), id, ownerId, now)
    .run();

  const tx = await c.env.DB.prepare(`SELECT * FROM transactions WHERE id = ?`)
    .bind(id)
    .first();
  return c.json({ success: true, data: { transaction: rowToTransaction(tx) } });
});

/** Buyer confirms delivery — releases credits */
transactions.post("/:id/confirm", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId)
    return c.json({ success: false, error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const body = await c.req.json<{ rating?: number; comment?: string }>().catch(() => ({}));

  const tx = await c.env.DB.prepare(
    `SELECT * FROM transactions WHERE id = ? AND buyer_owner_id = ? AND status IN ('escrowed', 'delivered')`,
  )
    .bind(id, ownerId)
    .first();

  if (!tx) {
    return c.json({ success: false, error: "Cannot confirm" }, 400);
  }

  const amount = tx.amount as number;
  const buyerWallet = await c.env.DB.prepare(
    `SELECT id FROM wallets WHERE owner_id = ?`,
  )
    .bind(ownerId)
    .first<{ id: string }>();
  const sellerWallet = await c.env.DB.prepare(
    `SELECT id FROM wallets WHERE owner_id = ?`,
  )
    .bind(tx.seller_owner_id as string)
    .first<{ id: string }>();

  if (!buyerWallet || !sellerWallet) {
    return c.json({ success: false, error: "Wallet error" }, 500);
  }

  const { commission, sellerPayout } = await releaseCredits(
    c.env.DB,
    buyerWallet.id,
    sellerWallet.id,
    amount,
    id,
  );

  const now = new Date().toISOString();

  const batch = [
    c.env.DB.prepare(
      `UPDATE transactions SET status = 'completed', commission = ?, seller_payout = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
    ).bind(commission, sellerPayout, now, now, id),
    c.env.DB.prepare(
      `INSERT INTO transaction_events (id, transaction_id, event_type, actor_type, actor_id, created_at)
       VALUES (?, ?, 'confirmed', 'buyer', ?, ?)`,
    ).bind(transactionEventId(), id, ownerId, now),
    // Update agent stats
    c.env.DB.prepare(
      `UPDATE agents SET total_transactions = total_transactions + 1, total_earnings = total_earnings + ?, updated_at = ? WHERE id = ?`,
    ).bind(sellerPayout, now, tx.agent_id as string),
  ];

  // Create review if rating provided
  if (body.rating && body.rating >= 1 && body.rating <= 5) {
    batch.push(
      c.env.DB.prepare(
        `INSERT INTO reviews (id, transaction_id, agent_id, reviewer_id, rating, comment, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        reviewId(),
        id,
        tx.agent_id as string,
        ownerId,
        body.rating,
        body.comment || null,
        now,
      ),
    );
    // Update agent avg rating
    batch.push(
      c.env.DB.prepare(
        `UPDATE agents SET avg_rating = (SELECT AVG(rating) FROM reviews WHERE agent_id = ?) WHERE id = ?`,
      ).bind(tx.agent_id as string, tx.agent_id as string),
    );
  }

  await c.env.DB.batch(batch);

  const updated = await c.env.DB.prepare(
    `SELECT * FROM transactions WHERE id = ?`,
  )
    .bind(id)
    .first();
  return c.json({
    success: true,
    data: { transaction: rowToTransaction(updated) },
  });
});

/** Buyer cancels before delivery */
transactions.post("/:id/cancel", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId)
    return c.json({ success: false, error: "Unauthorized" }, 401);

  const id = c.req.param("id");

  const tx = await c.env.DB.prepare(
    `SELECT * FROM transactions WHERE id = ? AND buyer_owner_id = ? AND status = 'escrowed'`,
  )
    .bind(id, ownerId)
    .first();

  if (!tx) {
    return c.json({ success: false, error: "Cannot cancel" }, 400);
  }

  const buyerWallet = await c.env.DB.prepare(
    `SELECT id FROM wallets WHERE owner_id = ?`,
  )
    .bind(ownerId)
    .first<{ id: string }>();

  if (!buyerWallet) {
    return c.json({ success: false, error: "Wallet error" }, 500);
  }

  await refundCredits(c.env.DB, buyerWallet.id, tx.amount as number, id);

  const now = new Date().toISOString();
  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE transactions SET status = 'cancelled', updated_at = ? WHERE id = ?`,
    ).bind(now, id),
    c.env.DB.prepare(
      `INSERT INTO transaction_events (id, transaction_id, event_type, actor_type, actor_id, created_at)
       VALUES (?, ?, 'cancelled', 'buyer', ?, ?)`,
    ).bind(transactionEventId(), id, ownerId, now),
  ]);

  return c.json({ success: true, data: { status: "cancelled" } });
});

/** Dispute a transaction — buyer or seller */
transactions.post("/:id/dispute", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId)
    return c.json({ success: false, error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const { reason } = await c.req.json<{ reason: string }>();

  const tx = await c.env.DB.prepare(
    `SELECT * FROM transactions WHERE id = ? AND (buyer_owner_id = ? OR seller_owner_id = ?) AND status IN ('escrowed', 'delivered')`,
  )
    .bind(id, ownerId, ownerId)
    .first();

  if (!tx) {
    return c.json({ success: false, error: "Cannot dispute" }, 400);
  }

  const actorType =
    tx.buyer_owner_id === ownerId ? "buyer" : "seller";
  const now = new Date().toISOString();

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE transactions SET status = 'disputed', disputed_at = ?, updated_at = ? WHERE id = ?`,
    ).bind(now, now, id),
    c.env.DB.prepare(
      `INSERT INTO transaction_events (id, transaction_id, event_type, actor_type, actor_id, metadata, created_at)
       VALUES (?, ?, 'disputed', ?, ?, ?, ?)`,
    ).bind(
      transactionEventId(),
      id,
      actorType,
      ownerId,
      JSON.stringify({ reason }),
      now,
    ),
  ]);

  return c.json({ success: true, data: { status: "disputed" } });
});

// ============================================================
// Helpers
// ============================================================

function rowToTransaction(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: row.id,
    buyerOwnerId: row.buyer_owner_id,
    sellerOwnerId: row.seller_owner_id,
    agentId: row.agent_id,
    amount: row.amount,
    commission: row.commission,
    sellerPayout: row.seller_payout,
    status: row.status,
    description: row.description,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : null,
    expiresAt: row.expires_at,
    deliveredAt: row.delivered_at,
    completedAt: row.completed_at,
    disputedAt: row.disputed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
