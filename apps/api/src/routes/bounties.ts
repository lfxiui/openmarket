import { Hono } from "hono";
import type { AppEnv } from "../types";
import { requireAuth } from "../middleware/auth";
import { bountyId, bountyAppId } from "../lib/id";

export const bounties = new Hono<AppEnv>();

/** Create a bounty */
bounties.post("/", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const body = await c.req.json<{
    title: string;
    description: string;
    budget: number;
    tags?: string[];
  }>();

  if (!body.title || !body.description || !body.budget) {
    return c.json(
      { success: false, error: "Title, description, and budget required" },
      400,
    );
  }
  if (body.budget < 100) {
    return c.json(
      { success: false, error: "Minimum budget is 100 credits" },
      400,
    );
  }

  const id = bountyId();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO bounties (id, owner_id, title, description, budget, tags, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      ownerId,
      body.title,
      body.description,
      body.budget,
      JSON.stringify(body.tags || []),
      now,
      now,
    )
    .run();

  const bounty = await c.env.DB.prepare(`SELECT * FROM bounties WHERE id = ?`)
    .bind(id)
    .first();

  return c.json(
    { success: true, data: { bounty: rowToBounty(bounty) } },
    201,
  );
});

/** List bounties (public) */
bounties.get("/", async (c) => {
  const status = c.req.query("status") || "open";
  const q = c.req.query("q") || "";
  const tags = c.req.query("tags") || "";
  const page = Number.parseInt(c.req.query("page") || "1");
  const limit = Math.min(Number.parseInt(c.req.query("limit") || "20"), 50);
  const offset = (page - 1) * limit;

  let where = "WHERE status = ?";
  const params: unknown[] = [status];

  if (q) {
    where += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  if (tags) {
    for (const tag of tags.split(",")) {
      where += " AND tags LIKE ?";
      params.push(`%"${tag.trim()}"%`);
    }
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM bounties ${where}`,
  )
    .bind(...params)
    .first<{ total: number }>();

  const rows = await c.env.DB.prepare(
    `SELECT * FROM bounties ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(...params, limit, offset)
    .all();

  return c.json({
    success: true,
    data: {
      data: rows.results.map(rowToBounty),
      total: countResult?.total || 0,
      page,
      limit,
    },
  });
});

/** Get bounty by ID + applications (if owner) */
bounties.get("/:id", async (c) => {
  const ownerId = c.get("ownerId");
  const id = c.req.param("id");

  const bounty = await c.env.DB.prepare(`SELECT * FROM bounties WHERE id = ?`)
    .bind(id)
    .first();

  if (!bounty) {
    return c.json({ success: false, error: "Bounty not found" }, 404);
  }

  const owner = await c.env.DB.prepare(
    `SELECT id, display_name, avatar_url, verified FROM owners WHERE id = ?`,
  )
    .bind(bounty.owner_id as string)
    .first();

  // Only show applications to the bounty owner
  let applications = null;
  if (ownerId === bounty.owner_id) {
    const apps = await c.env.DB.prepare(
      `SELECT ba.*, a.name as agent_name, a.slug as agent_slug, a.avg_rating, a.total_transactions,
              o.display_name as applicant_name
       FROM bounty_applications ba
       JOIN agents a ON ba.agent_id = a.id
       JOIN owners o ON ba.owner_id = o.id
       WHERE ba.bounty_id = ?
       ORDER BY ba.created_at DESC`,
    )
      .bind(id)
      .all();

    applications = apps.results.map((r) => ({
      id: r.id,
      agentId: r.agent_id,
      agentName: r.agent_name,
      agentSlug: r.agent_slug,
      agentRating: r.avg_rating,
      agentJobs: r.total_transactions,
      applicantName: r.applicant_name,
      message: r.message,
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  // Count applications for public view
  const appCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM bounty_applications WHERE bounty_id = ?`,
  )
    .bind(id)
    .first<{ count: number }>();

  return c.json({
    success: true,
    data: {
      bounty: rowToBounty(bounty),
      owner: owner
        ? {
            id: owner.id,
            displayName: owner.display_name,
            avatarUrl: owner.avatar_url,
            verified: owner.verified === 1,
          }
        : null,
      applicationCount: appCount?.count || 0,
      applications,
    },
  });
});

/** Update bounty */
bounties.put("/:id", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const existing = await c.env.DB.prepare(
    `SELECT owner_id, status FROM bounties WHERE id = ?`,
  )
    .bind(id)
    .first<{ owner_id: string; status: string }>();

  if (!existing || existing.owner_id !== ownerId) {
    return c.json({ success: false, error: "Not found" }, 404);
  }
  if (existing.status !== "open") {
    return c.json({ success: false, error: "Can only edit open bounties" }, 400);
  }

  const body = await c.req.json();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.title) {
    updates.push("title = ?");
    values.push(body.title);
  }
  if (body.description) {
    updates.push("description = ?");
    values.push(body.description);
  }
  if (body.budget) {
    updates.push("budget = ?");
    values.push(body.budget);
  }
  if (body.tags) {
    updates.push("tags = ?");
    values.push(JSON.stringify(body.tags));
  }

  if (updates.length === 0) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  await c.env.DB.prepare(
    `UPDATE bounties SET ${updates.join(", ")} WHERE id = ?`,
  )
    .bind(...values)
    .run();

  const bounty = await c.env.DB.prepare(`SELECT * FROM bounties WHERE id = ?`)
    .bind(id)
    .first();
  return c.json({ success: true, data: { bounty: rowToBounty(bounty) } });
});

/** Close bounty */
bounties.post("/:id/close", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const result = await c.env.DB.prepare(
    `UPDATE bounties SET status = 'closed', updated_at = ? WHERE id = ? AND owner_id = ? AND status = 'open'`,
  )
    .bind(new Date().toISOString(), id, ownerId)
    .run();

  if (!result.meta.changes) {
    return c.json({ success: false, error: "Cannot close" }, 400);
  }

  return c.json({ success: true, data: { status: "closed" } });
});

/** Apply to a bounty with an agent */
bounties.post("/:id/apply", async (c) => {
  const ownerId = requireAuth(c);
  if (!ownerId) return c.json({ success: false, error: "Unauthorized" }, 401);

  const bountyIdParam = c.req.param("id");
  const { agentId, message } = await c.req.json<{
    agentId: string;
    message?: string;
  }>();

  if (!agentId) {
    return c.json({ success: false, error: "agentId required" }, 400);
  }

  // Verify bounty is open
  const bounty = await c.env.DB.prepare(
    `SELECT owner_id, status FROM bounties WHERE id = ?`,
  )
    .bind(bountyIdParam)
    .first<{ owner_id: string; status: string }>();

  if (!bounty || bounty.status !== "open") {
    return c.json({ success: false, error: "Bounty not found or not open" }, 404);
  }
  if (bounty.owner_id === ownerId) {
    return c.json({ success: false, error: "Cannot apply to your own bounty" }, 400);
  }

  // Verify agent belongs to applicant and is listed
  const agent = await c.env.DB.prepare(
    `SELECT id FROM agents WHERE id = ? AND owner_id = ? AND status = 'listed'`,
  )
    .bind(agentId, ownerId)
    .first();

  if (!agent) {
    return c.json(
      { success: false, error: "Agent not found or not listed" },
      404,
    );
  }

  // Check for duplicate application
  const existing = await c.env.DB.prepare(
    `SELECT id FROM bounty_applications WHERE bounty_id = ? AND agent_id = ?`,
  )
    .bind(bountyIdParam, agentId)
    .first();

  if (existing) {
    return c.json({ success: false, error: "Already applied" }, 409);
  }

  const id = bountyAppId();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO bounty_applications (id, bounty_id, agent_id, owner_id, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, bountyIdParam, agentId, ownerId, message || null, now)
    .run();

  return c.json({ success: true, data: { applicationId: id } }, 201);
});

// ============================================================
// Helpers
// ============================================================

function rowToBounty(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    budget: row.budget,
    tags: JSON.parse((row.tags as string) || "[]"),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
