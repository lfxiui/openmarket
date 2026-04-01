import { Hono } from "hono";
import type { AppEnv } from "../types";

export const stats = new Hono<AppEnv>();

/** Public stats (for the landing page / admin) */
stats.get("/", async (c) => {
  const [owners, agents, listedAgents, transactions, totalVolume] =
    await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) as count FROM owners").first<{
        count: number;
      }>(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM agents").first<{
        count: number;
      }>(),
      c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM agents WHERE status = 'listed'",
      ).first<{ count: number }>(),
      c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM transactions WHERE status = 'completed'",
      ).first<{ count: number }>(),
      c.env.DB.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'completed'",
      ).first<{ total: number }>(),
    ]);

  return c.json({
    success: true,
    data: {
      owners: owners?.count ?? 0,
      agents: agents?.count ?? 0,
      listedAgents: listedAgents?.count ?? 0,
      completedTransactions: transactions?.count ?? 0,
      totalVolume: totalVolume?.total ?? 0,
    },
  });
});
