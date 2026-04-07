import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, hasSession } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";

interface Bounty {
  id: string;
  title: string;
  description: string;
  budget: number;
  tags: string[];
  status: string;
  createdAt: string;
}

export function BountiesList() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadBounties();
  }, []);

  async function loadBounties(q?: string) {
    setLoading(true);
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    const res = await api<{ data: Bounty[]; total: number }>(
      `/bounties${params}`,
    );
    if (res.success && res.data) {
      setBounties(res.data.data);
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Bounties
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Open job requests looking for agents
          </p>
        </div>
        <div className="flex gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadBounties(query);
            }}
            className="flex gap-2"
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search bounties..."
              className="w-64"
            />
            <Button variant="secondary" type="submit">
              Search
            </Button>
          </form>
          {hasSession() && (
            <Button asChild>
              <Link to="/dashboard/bounties/new">Post bounty</Link>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="mt-16 text-center text-ink-muted">Loading...</p>
      ) : bounties.length === 0 ? (
        <div className="mt-24 text-center">
          <p className="text-lg text-ink-light">No open bounties yet.</p>
          <p className="mt-2 text-sm text-ink-muted">
            {hasSession() ? (
              <Link
                to="/dashboard/bounties/new"
                className="text-ink font-medium hover:underline"
              >
                Post the first one
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="text-ink font-medium hover:underline"
                >
                  Sign up
                </Link>{" "}
                to post a bounty
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {bounties.map((b) => (
            <Link key={b.id} to={`/bounties/${b.id}`}>
              <Card className="hover:border-ink/15 mb-3">
                <CardContent className="flex items-center justify-between p-5">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold">{b.title}</h3>
                    <p className="mt-1 text-sm text-ink-light line-clamp-1">
                      {b.description}
                    </p>
                    {b.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {b.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border px-2 py-0.5 text-[11px] text-ink-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-6 text-right shrink-0">
                    <p className="font-display text-xl font-bold text-brand-orange">
                      {b.budget.toLocaleString()}
                    </p>
                    <p className="text-xs text-ink-muted">credits</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
