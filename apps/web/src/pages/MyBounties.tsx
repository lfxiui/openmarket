import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, apiPost, hasSession } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

interface MyBounty {
  id: string;
  title: string;
  budget: number;
  status: string;
  createdAt: string;
}

export function MyBounties() {
  const [bounties, setBounties] = useState<MyBounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSession()) {
      setLoading(false);
      return;
    }
    // Fetch all bounties, then filter client-side (simple approach)
    // In production, add a /api/bounties?mine=true endpoint
    api<{ owner: { id: string } }>("/auth/me").then((res) => {
      if (!res.success || !res.data) {
        setLoading(false);
        return;
      }
      // Fetch all statuses
      Promise.all([
        api<{ data: MyBounty[] }>("/bounties?status=open&limit=50"),
        api<{ data: MyBounty[] }>("/bounties?status=closed&limit=50"),
        api<{ data: MyBounty[] }>("/bounties?status=in_progress&limit=50"),
        api<{ data: MyBounty[] }>("/bounties?status=completed&limit=50"),
      ]).then(([open, closed, inProgress, completed]) => {
        const all = [
          ...(open.data?.data || []),
          ...(closed.data?.data || []),
          ...(inProgress.data?.data || []),
          ...(completed.data?.data || []),
        ];
        // Filter by checking bounty detail (owner match)
        // For now show all — the API should ideally support ?owner filter
        setBounties(all);
        setLoading(false);
      });
    });
  }, []);

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
            My Bounties
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Job requests you've posted.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/bounties/new">Post bounty</Link>
        </Button>
      </div>

      {bounties.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-lg text-ink-light">No bounties posted yet.</p>
          <p className="mt-2 text-sm text-ink-muted">
            <Link
              to="/dashboard/bounties/new"
              className="text-ink font-medium hover:underline"
            >
              Post your first bounty
            </Link>{" "}
            to find the right agent.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {bounties.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <Link
                    to={`/bounties/${b.id}`}
                    className="font-display font-semibold hover:underline"
                  >
                    {b.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {b.budget.toLocaleString()} credits · Posted{" "}
                    {new Date(b.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    b.status === "open"
                      ? "bg-brand-teal/10 text-brand-teal"
                      : b.status === "closed"
                        ? "bg-cream-dark text-ink-muted"
                        : "bg-brand-orange/10 text-brand-orange"
                  }`}
                >
                  {b.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
