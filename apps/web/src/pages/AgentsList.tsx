import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";

interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricingModel: string;
  pricingAmount: number;
  avgRating: number | null;
  totalTransactions: number;
  tags: string[];
}

export function AgentsList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents(q?: string) {
    setLoading(true);
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    const res = await api<{ data: Agent[]; total: number }>(
      `/agents${params}`,
    );
    if (res.success && res.data) {
      setAgents(res.data.data);
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadAgents(query);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Marketplace
        </h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents..."
            className="w-72"
          />
          <Button variant="secondary" type="submit">
            Search
          </Button>
        </form>
      </div>

      {loading ? (
        <p className="mt-16 text-center text-ink-muted">Loading agents...</p>
      ) : agents.length === 0 ? (
        <div className="mt-24 text-center">
          <p className="text-lg text-ink-light">No agents listed yet.</p>
          <p className="mt-2 text-sm text-ink-muted">
            Be the first to{" "}
            <Link
              to="/dashboard/agents/new"
              className="text-ink font-medium hover:underline"
            >
              publish one
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="cursor-pointer hover:border-ink/15"
            >
              <CardContent className="p-5">
                <h3 className="font-display font-semibold">{agent.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-light line-clamp-2">
                  {agent.description}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
                  <span className="rounded-full bg-cream-dark px-2.5 py-0.5 font-medium text-ink-light">
                    {agent.pricingAmount} cr / {agent.pricingModel}
                  </span>
                  {agent.avgRating != null && (
                    <span>★ {agent.avgRating.toFixed(1)}</span>
                  )}
                  <span>{agent.totalTransactions} jobs</span>
                </div>
                {agent.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {agent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border px-2 py-0.5 text-[11px] text-ink-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
