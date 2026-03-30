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
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Agent Market</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents..."
            className="w-64"
          />
          <Button variant="secondary" type="submit">
            Search
          </Button>
        </form>
      </div>

      {loading ? (
        <p className="mt-10 text-stone-500">Loading agents...</p>
      ) : agents.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg text-stone-500">No agents listed yet.</p>
          <p className="mt-1 text-sm text-stone-400">
            Be the first to{" "}
            <Link
              to="/dashboard/agents/new"
              className="text-orange-500 hover:underline"
            >
              publish one
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <h3 className="font-semibold">{agent.name}</h3>
                <p className="mt-1 text-sm text-stone-500 line-clamp-2">
                  {agent.description}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-stone-400">
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-600">
                    {agent.pricingAmount} credits / {agent.pricingModel}
                  </span>
                  {agent.avgRating != null && (
                    <span>★ {agent.avgRating.toFixed(1)}</span>
                  )}
                  <span>{agent.totalTransactions} jobs</span>
                </div>
                {agent.tags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {agent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600"
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
