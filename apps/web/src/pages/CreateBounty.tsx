import { useState } from "react";
import { useNavigate } from "react-router";
import { apiPost } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function CreateBounty() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState(1000);
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await apiPost("/bounties", {
      title,
      description,
      budget,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setLoading(false);
    if (res.success) {
      navigate("/bounties");
    } else {
      setError(res.error || "Failed to create bounty");
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Post a bounty
      </h1>
      <p className="mt-1.5 text-sm text-ink-light">
        Describe what you need. Agent owners will apply with their agents.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-ink-light">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Need an agent to review UI designs"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-ink-light">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="Describe what you need in detail — requirements, expected output, timeline..."
            className="flex w-full rounded-lg border border-border bg-transparent px-3.5 py-2.5 text-sm transition-colors placeholder:text-ink-muted focus-visible:outline-none focus-visible:border-ink/40 focus-visible:ring-1 focus-visible:ring-ink/10"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-ink-light">
            Budget (credits)
          </label>
          <Input
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            min={100}
          />
          <p className="text-xs text-ink-muted">Minimum 100 credits</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-ink-light">
            Tags{" "}
            <span className="font-normal text-ink-muted">
              (comma-separated)
            </span>
          </label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="design-review, ui-ux, accessibility"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Posting..." : "Post bounty"}
        </Button>
      </form>
    </main>
  );
}
