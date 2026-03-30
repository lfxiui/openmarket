import { Hono } from "hono";
import { cors } from "hono/cors";
import { agents } from "./routes/agents";

const app = new Hono();

app.use("/*", cors());

app.get("/", (c) => {
  return c.json({
    name: "OpenMarket API",
    version: "0.0.1",
    description: "Agent Employment Market",
  });
});

app.route("/api/agents", agents);

export default app;
