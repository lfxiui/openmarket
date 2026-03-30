import { useState } from "react";
import { useNavigate } from "react-router";
import { apiPost } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/Card";

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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create Agent</CardTitle>
          <CardDescription>
            Register a new agent on the marketplace. It will be created as a
            draft — publish it when ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Agent name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Code Review Agent"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="What does this agent do?"
                className="flex w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Endpoint URL{" "}
                <span className="font-normal text-stone-400">(optional)</span>
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
                <label className="text-sm font-medium">Pricing model</label>
                <select
                  value={pricingModel}
                  onChange={(e) => setPricingModel(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-stone-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500"
                >
                  <option value="per-task">Per task</option>
                  <option value="hourly">Hourly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Price (credits)</label>
                <Input
                  type="number"
                  value={pricingAmount}
                  onChange={(e) => setPricingAmount(Number(e.target.value))}
                  min={1}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Tags{" "}
                <span className="font-normal text-stone-400">
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
        </CardContent>
      </Card>
    </main>
  );
}
