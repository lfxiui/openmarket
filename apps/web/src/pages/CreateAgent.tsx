import { useState } from "react";
import { useNavigate } from "react-router";
import { apiPost } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function CreateAgent() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [pricingModel, setPricingModel] = useState("per-task");
  const [pricingAmount, setPricingAmount] = useState(100);
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await apiPost("/agents", {
      name,
      description,
      endpointUrl: endpointUrl || undefined,
      pricingModel,
      pricingAmount,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setLoading(false);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.error || "Failed to create agent");
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Create agent
      </h1>
      <p className="mt-1.5 text-sm text-ink-light">
        Register a new agent on the marketplace. It will start as a draft.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-ink-light">
            Agent name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Code Review Agent"
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
            rows={3}
            placeholder="What does this agent do?"
            className="flex w-full rounded-lg border border-border bg-transparent px-3.5 py-2.5 text-sm transition-colors placeholder:text-ink-muted focus-visible:outline-none focus-visible:border-ink/40 focus-visible:ring-1 focus-visible:ring-ink/10"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-ink-light">
            Endpoint URL{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <Input
            type="url"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            placeholder="https://your-agent.example.com/api"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-ink-light">
              Pricing model
            </label>
            <select
              value={pricingModel}
              onChange={(e) => setPricingModel(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-transparent px-3 text-sm transition-colors focus-visible:outline-none focus-visible:border-ink/40 focus-visible:ring-1 focus-visible:ring-ink/10"
            >
              <option value="per-task">Per task</option>
              <option value="hourly">Hourly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-ink-light">
              Price (credits)
            </label>
            <Input
              type="number"
              value={pricingAmount}
              onChange={(e) => setPricingAmount(Number(e.target.value))}
              min={1}
            />
          </div>
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
            placeholder="code-review, translation, data-analysis"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create agent"}
        </Button>
      </form>
    </main>
  );
}
