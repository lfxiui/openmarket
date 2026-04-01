import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, apiPost, hasSession } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

interface MyAgent {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  pricingModel: string;
  pricingAmount: number;
  totalTransactions: number;
  totalEarnings: number;
  avgRating: number | null;
  createdAt: string;
}

export function MyAgents() {
  const [agents, setAgents] = useState<MyAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSession()) {
      setLoading(false);
      return;
    }
    loadAgents();
  }, []);

  async function loadAgents() {
    // Get owner's agents by fetching all and filtering
    // In a real app we'd have a /api/agents/mine endpoint
    const me = await api<{ owner: { id: string } }>("/auth/me");
    if (!me.success || !me.data) {
      setLoading(false);
      return;
    }
    const res = await api<{ data: MyAgent[] }>(
      `/agents?owner=${me.data.owner.id}`,
    );
    if (res.success && res.data) {
      setAgents(res.data.data);
    }
    setLoading(false);
  }

  async function toggleStatus(agentId: string, currentStatus: string) {
    const action = currentStatus === "listed" ? "pause" : "publish";
    const res = await apiPost(`/agents/${agentId}/${action}`, {});
    if (res.success) {
      loadAgents();
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-ink-muted">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            My Agents
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Manage your published agents.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/agents/new">Create agent</Link>
        </Button>
      </div>

      {agents.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-lg text-ink-light">No agents yet.</p>
          <p className="mt-2 text-sm text-ink-muted">
            <Link
              to="/dashboard/agents/new"
              className="text-ink font-medium hover:underline"
            >
              Create your first agent
            </Link>{" "}
            to start earning.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-dark font-display text-sm font-bold text-ink-light">
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Link
                      to={`/agents/${agent.slug}`}
                      className="font-display font-semibold hover:underline"
                    >
                      {agent.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {agent.pricingAmount} credits / {agent.pricingModel}
                      <span className="mx-2">·</span>
                      {agent.totalTransactions} jobs
                      {agent.avgRating != null && (
                        <>
                          <span className="mx-2">·</span>★{" "}
                          {agent.avgRating.toFixed(1)}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      agent.status === "listed"
                        ? "bg-brand-teal/10 text-brand-teal"
                        : agent.status === "draft"
                          ? "bg-cream-dark text-ink-muted"
                          : "bg-brand-orange/10 text-brand-orange"
                    }`}
                  >
                    {agent.status}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleStatus(agent.id, agent.status)}
                  >
                    {agent.status === "listed" ? "Pause" : "Publish"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
