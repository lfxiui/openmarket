import { Hono } from "hono";
import type { AppEnv } from "../types";
import { requireAuth } from "../middleware/auth";
import { agentId } from "../lib/id";

export const agents = new Hono<AppEnv>();

/** Create a new agent */
agents.post("/", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const body = await c.req.json<{
    name: string;
    description: string;
    longDescription?: string;
    endpointUrl?: string;
    tags?: string[];
    pricingModel: string;
    pricingAmount: number;
  }>();

  if (!body.name || !body.pricingModel) {
    return c.json({ success: false, error: "Name and pricingModel required" }, 400);
  }

  const id = agentId();
  const slug = slugify(body.name, id);
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO agents (id, owner_id, name, slug, description, long_description, endpoint_url, tags, pricing_model, pricing_amount, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
  ).bind(
    id, ownerId, body.name, slug,
    body.description || "", body.longDescription || null,
    body.endpointUrl || null, JSON.stringify(body.tags || []),
    body.pricingModel, body.pricingAmount || 0,
    now, now,
  ).run();

  const agent = await c.env.DB.prepare(`SELECT * FROM agents WHERE id = ?`)
    .bind(id)
    .first();

  return c.json({ success: true, data: { agent: rowToAgent(agent) } }, 201);
});

/** List agents (public discovery) */
agents.get("/", async (c) => {
  const q = c.req.query("q") || "";
  const tags = c.req.query("tags") || "";
  const sort = c.req.query("sort") || "newest";
  const page = Number.parseInt(c.req.query("page") || "1");
  const limit = Math.min(Number.parseInt(c.req.query("limit") || "20"), 50);
  const offset = (page - 1) * limit;

  const ownerId = c.req.query("owner") || "";

  let where = ownerId ? "WHERE owner_id = ?" : "WHERE status = 'listed'";
  const params: unknown[] = ownerId ? [ownerId] : [];

  if (q) {
    where += " AND (name LIKE ? OR description LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  if (tags) {
    for (const tag of tags.split(",")) {
      where += " AND tags LIKE ?";
      params.push(`%"${tag.trim()}"%`);
    }
  }

  let orderBy = "ORDER BY created_at DESC";
  if (sort === "rating") orderBy = "ORDER BY avg_rating DESC NULLS LAST";
  if (sort === "transactions") orderBy = "ORDER BY total_transactions DESC";

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM agents ${where}`,
  ).bind(...params).first<{ total: number }>();

  const rows = await c.env.DB.prepare(
    `SELECT * FROM agents ${where} ${orderBy} LIMIT ? OFFSET ?`,
  ).bind(...params, limit, offset).all();

  return c.json({
    success: true,
    data: {
      data: rows.results.map(rowToAgent),
      total: countResult?.total || 0,
      page,
      limit,
    },
  });
});

/** Get agent by ID or slug (public) */
agents.get("/:idOrSlug", async (c) => {
  const idOrSlug = c.req.param("idOrSlug");
  const agent = await c.env.DB.prepare(
    `SELECT * FROM agents WHERE id = ? OR slug = ?`,
  ).bind(idOrSlug, idOrSlug).first();

  if (!agent) {
    return c.json({ success: false, error: "Agent not found" }, 404);
  }

  const owner = await c.env.DB.prepare(
    `SELECT id, display_name, avatar_url, verified FROM owners WHERE id = ?`,
  ).bind(agent.owner_id as string).first();

  return c.json({
    success: true,
    data: {
      agent: rowToAgent(agent),
      owner: owner ? {
        id: owner.id,
        displayName: owner.display_name,
        avatarUrl: owner.avatar_url,
        verified: owner.verified === 1,
      } : null,
    },
  });
});

/** Update agent */
agents.put("/:id", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const existing = await c.env.DB.prepare(
    `SELECT owner_id FROM agents WHERE id = ?`,
  ).bind(id).first<{ owner_id: string }>();

  if (!existing || existing.owner_id !== ownerId) {
    return c.json({ success: false, error: "Not found or not yours" }, 404);
  }

  const body = await c.req.json();
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(body)) {
    const col = camelToSnake(key);
    if (["name", "description", "long_description", "endpoint_url", "pricing_model", "pricing_amount"].includes(col)) {
      updates.push(`${col} = ?`);
      values.push(key === "tags" ? JSON.stringify(value) : value);
    }
  }
  if (body.tags) {
    updates.push("tags = ?");
    values.push(JSON.stringify(body.tags));
  }

  if (updates.length === 0) {
    return c.json({ success: false, error: "No valid fields to update" }, 400);
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  await c.env.DB.prepare(
    `UPDATE agents SET ${updates.join(", ")} WHERE id = ?`,
  ).bind(...values).run();

  const agent = await c.env.DB.prepare(`SELECT * FROM agents WHERE id = ?`).bind(id).first();
  return c.json({ success: true, data: { agent: rowToAgent(agent) } });
});

/** Publish agent */
agents.post("/:id/publish", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const result = await c.env.DB.prepare(
    `UPDATE agents SET status = 'listed', updated_at = ? WHERE id = ? AND owner_id = ? AND status IN ('draft', 'paused')`,
  ).bind(new Date().toISOString(), id, ownerId).run();

  if (!result.meta.changes) {
    return c.json({ success: false, error: "Cannot publish" }, 400);
  }

  const agent = await c.env.DB.prepare(`SELECT * FROM agents WHERE id = ?`).bind(id).first();
  return c.json({ success: true, data: { agent: rowToAgent(agent) } });
});

/** Pause agent */
agents.post("/:id/pause", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const result = await c.env.DB.prepare(
    `UPDATE agents SET status = 'paused', updated_at = ? WHERE id = ? AND owner_id = ? AND status = 'listed'`,
  ).bind(new Date().toISOString(), id, ownerId).run();

  if (!result.meta.changes) {
    return c.json({ success: false, error: "Cannot pause" }, 400);
  }

  const agent = await c.env.DB.prepare(`SELECT * FROM agents WHERE id = ?`).bind(id).first();
  return c.json({ success: true, data: { agent: rowToAgent(agent) } });
});

// ============================================================
// Helpers
// ============================================================

function slugify(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${id.slice(-6)}`;
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function rowToAgent(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    longDescription: row.long_description,
    endpointUrl: row.endpoint_url,
    tags: JSON.parse((row.tags as string) || "[]"),
    pricingModel: row.pricing_model,
    pricingAmount: row.pricing_amount,
    status: row.status,
    totalTransactions: row.total_transactions,
    totalEarnings: row.total_earnings,
    avgRating: row.avg_rating,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
