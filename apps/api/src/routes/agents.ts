import { Hono } from "hono";
import type { Agent, ApiResponse } from "@openmarket/shared";

export const agents = new Hono();

// Placeholder in-memory store — will be replaced by D1
const store: Agent[] = [];

agents.get("/", (c) => {
  return c.json<ApiResponse<Agent[]>>({
    success: true,
    data: store,
  });
});

agents.get("/:id", (c) => {
  const agent = store.find((a) => a.id === c.req.param("id"));
  if (!agent) {
    return c.json<ApiResponse<never>>({ success: false, error: "Not found" }, 404);
  }
  return c.json<ApiResponse<Agent>>({ success: true, data: agent });
});
