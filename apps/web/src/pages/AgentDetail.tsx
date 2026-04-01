import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { api } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

interface AgentDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string | null;
  endpointUrl: string | null;
  tags: string[];
  pricingModel: string;
  pricingAmount: number;
  status: string;
  totalTransactions: number;
  totalEarnings: number;
  avgRating: number | null;
  createdAt: string;
}

interface OwnerInfo {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
}

export function AgentDetail() {
  const { slug } = useParams();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api<{ agent: AgentDetail; owner: OwnerInfo }>(`/agents/${slug}`).then(
      (res) => {
        if (res.success && res.data) {
          setAgent(res.data.agent);
          setOwner(res.data.owner);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      },
    );
  }, [slug]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-ink-muted">Loading...</p>
      </main>
    );
  }

  if (notFound || !agent) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Agent not found</h1>
        <p className="mt-2 text-ink-light">
          <Link to="/agents" className="text-ink font-medium hover:underline">
            Back to marketplace
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink-muted">
        <Link to="/agents" className="hover:text-ink">
          Marketplace
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{agent.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-dark font-display text-lg font-bold text-ink-light">
              {agent.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {agent.name}
              </h1>
              {owner && (
                <p className="mt-0.5 text-sm text-ink-muted">
                  by {owner.displayName}
                  {owner.verified && (
                    <span className="ml-1.5 inline-flex items-center rounded-full bg-brand-teal/10 px-2 py-0.5 text-[11px] font-medium text-brand-teal">
                      Verified
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <p className="mt-6 text-[15px] leading-relaxed text-ink-light">
            {agent.description}
          </p>

          {agent.longDescription && (
            <div className="mt-6 text-sm leading-relaxed text-ink-light whitespace-pre-wrap">
              {agent.longDescription}
            </div>
          )}

          {/* Tags */}
          {agent.tags.length > 0 && (
            <div className="mt-8">
              <p className="text-[13px] font-medium text-ink-muted">Tags</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {agent.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-2.5 py-0.5 text-[12px] text-ink-light"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Endpoint */}
          {agent.endpointUrl && (
            <div className="mt-8">
              <p className="text-[13px] font-medium text-ink-muted">
                Endpoint
              </p>
              <code className="mt-1 block rounded-lg bg-cream-dark px-3 py-2 text-sm text-ink-light">
                {agent.endpointUrl}
              </code>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-[13px] text-ink-muted">Price</p>
              <p className="mt-1 font-display text-3xl font-bold">
                {agent.pricingAmount.toLocaleString()}
              </p>
              <p className="text-sm text-ink-muted">
                credits / {agent.pricingModel}
              </p>
              <Button className="mt-5 w-full" size="lg">
                Hire this agent
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Rating</span>
                <span className="font-medium">
                  {agent.avgRating != null
                    ? `★ ${agent.avgRating.toFixed(1)}`
                    : "No ratings yet"}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Completed jobs</span>
                <span className="font-medium">{agent.totalTransactions}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Total earned</span>
                <span className="font-medium">
                  {agent.totalEarnings.toLocaleString()} credits
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Listed since</span>
                <span className="font-medium">
                  {new Date(agent.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
