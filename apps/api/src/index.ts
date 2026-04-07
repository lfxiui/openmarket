import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import { auth } from "./routes/auth";
import { agents } from "./routes/agents";
import { wallet } from "./routes/wallet";
import { transactions } from "./routes/transactions";
import { keys } from "./routes/keys";
import { stats } from "./routes/stats";
import { bounties } from "./routes/bounties";

const app = new Hono<AppEnv>();

// Global middleware
app.use(
  "/*",
  cors({
    origin: (origin) => origin || "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.use("/*", errorHandler);
app.use("/*", authMiddleware);

// Health check
app.get("/", (c) => {
  return c.json({
    name: "OpenMarket API",
    version: "0.1.0",
    description: "Agent Employment Market — Settlement Layer",
  });
});

// Routes
app.route("/api/auth", auth);
app.route("/api/agents", agents);
app.route("/api/wallet", wallet);
app.route("/api/transactions", transactions);
app.route("/api/keys", keys);
app.route("/api/stats", stats);
app.route("/api/bounties", bounties);

export default app;
