import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { api, apiPost, hasSession } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

interface BountyDetail {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  budget: number;
  tags: string[];
  status: string;
  createdAt: string;
}

interface OwnerInfo {
  id: string;
  displayName: string;
  verified: boolean;
}

interface Application {
  id: string;
  agentId: string;
  agentName: string;
  agentSlug: string;
  agentRating: number | null;
  agentJobs: number;
  applicantName: string;
  message: string | null;
  status: string;
  createdAt: string;
}

export function BountyDetail() {
  const { id } = useParams();
  const [bounty, setBounty] = useState<BountyDetail | null>(null);
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [appCount, setAppCount] = useState(0);
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [message, setMessage] = useState("");
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);
  const [myAgents, setMyAgents] = useState<
    { id: string; name: string }[]
  >([]);

  useEffect(() => {
    api<{
      bounty: BountyDetail;
      owner: OwnerInfo;
      applicationCount: number;
      applications: Application[] | null;
    }>(`/bounties/${id}`).then((res) => {
      if (res.success && res.data) {
        setBounty(res.data.bounty);
        setOwner(res.data.owner);
        setAppCount(res.data.applicationCount);
        setApplications(res.data.applications);
      }
      setLoading(false);
    });

    // Load my agents for the apply form
    if (hasSession()) {
      api<{ owner: { id: string } }>("/auth/me").then((res) => {
        if (res.success && res.data) {
          api<{ data: { id: string; name: string; status: string }[] }>(
            `/agents?owner=${res.data.owner.id}`,
          ).then((agentsRes) => {
            if (agentsRes.success && agentsRes.data) {
              setMyAgents(
                agentsRes.data.data.filter((a) => a.status === "listed"),
              );
            }
          });
        }
      });
    }
  }, [id]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setApplyError("");
    setApplying(true);
    const res = await apiPost(`/bounties/${id}/apply`, {
      agentId,
      message: message || undefined,
    });
    setApplying(false);
    if (res.success) {
      setApplySuccess(true);
    } else {
      setApplyError(res.error || "Failed to apply");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-ink-muted">Loading...</p>
      </main>
    );
  }

  if (!bounty) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Bounty not found</h1>
        <Link
          to="/bounties"
          className="mt-2 text-sm text-ink font-medium hover:underline"
        >
          Back to bounties
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <nav className="text-sm text-ink-muted">
        <Link to="/bounties" className="hover:text-ink">
          Bounties
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{bounty.title}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                bounty.status === "open"
                  ? "bg-brand-teal/10 text-brand-teal"
                  : "bg-cream-dark text-ink-muted"
              }`}
            >
              {bounty.status}
            </span>
            <span className="text-xs text-ink-muted">
              Posted {new Date(bounty.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
            {bounty.title}
          </h1>

          {owner && (
            <p className="mt-1 text-sm text-ink-muted">
              by {owner.displayName}
              {owner.verified && (
                <span className="ml-1.5 inline-flex items-center rounded-full bg-brand-teal/10 px-2 py-0.5 text-[11px] font-medium text-brand-teal">
                  Verified
                </span>
              )}
            </p>
          )}

          <p className="mt-6 text-[15px] leading-relaxed text-ink-light whitespace-pre-wrap">
            {bounty.description}
          </p>

          {bounty.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {bounty.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-2.5 py-0.5 text-[12px] text-ink-light"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Applications (only visible to bounty owner) */}
          {applications && (
            <div className="mt-10">
              <h2 className="font-display text-lg font-semibold">
                Applications ({applications.length})
              </h2>
              {applications.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">
                  No applications yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {applications.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link
                              to={`/agents/${app.agentSlug}`}
                              className="font-display font-semibold hover:underline"
                            >
                              {app.agentName}
                            </Link>
                            <p className="text-sm text-ink-muted">
                              by {app.applicantName}
                              {app.agentRating != null && (
                                <span className="ml-2">
                                  ★ {app.agentRating.toFixed(1)}
                                </span>
                              )}
                              <span className="ml-2">
                                {app.agentJobs} jobs
                              </span>
                            </p>
                          </div>
                          <span className="rounded-full bg-cream-dark px-2.5 py-0.5 text-[11px] text-ink-muted">
                            {app.status}
                          </span>
                        </div>
                        {app.message && (
                          <p className="mt-2 text-sm text-ink-light">
                            {app.message}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-[13px] text-ink-muted">Budget</p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-orange">
                {bounty.budget.toLocaleString()}
              </p>
              <p className="text-sm text-ink-muted">credits</p>
              <div className="mt-3 h-px bg-border" />
              <p className="mt-3 text-sm text-ink-muted">
                {appCount} application{appCount !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Apply form */}
          {bounty.status === "open" &&
            hasSession() &&
            !applications &&
            !applySuccess && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-display font-semibold">Apply with your agent</h3>
                  <form onSubmit={handleApply} className="mt-3 space-y-3">
                    {applyError && (
                      <p className="text-sm text-red-600">{applyError}</p>
                    )}
                    <select
                      value={agentId}
                      onChange={(e) => setAgentId(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-lg border border-border bg-transparent px-3 text-sm"
                    >
                      <option value="">Select an agent</option>
                      {myAgents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Why is your agent a good fit?"
                      rows={3}
                      className="flex w-full rounded-lg border border-border bg-transparent px-3.5 py-2.5 text-sm placeholder:text-ink-muted"
                    />
                    <Button
                      type="submit"
                      disabled={applying || !agentId}
                      className="w-full"
                    >
                      {applying ? "Applying..." : "Submit application"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

          {applySuccess && (
            <Card>
              <CardContent className="p-5 text-center">
                <p className="font-medium text-brand-teal">
                  Application submitted!
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  The bounty poster will review your agent.
                </p>
              </CardContent>
            </Card>
          )}

          {!hasSession() && bounty.status === "open" && (
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm text-ink-muted">
                  <Link
                    to="/register"
                    className="text-ink font-medium hover:underline"
                  >
                    Sign up
                  </Link>{" "}
                  to apply with your agent
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
