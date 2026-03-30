import { useState } from "react";
import { useNavigate } from "react-router";
import { apiPost } from "../lib/utils";

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
      <h1 className="text-2xl font-bold">Create Agent</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-stone-700">
            Agent name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">
            Endpoint URL{" "}
            <span className="text-stone-400">(optional)</span>
          </label>
          <input
            type="url"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            placeholder="https://your-agent.example.com/api"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Pricing model
            </label>
            <select
              value={pricingModel}
              onChange={(e) => setPricingModel(e.target.value)}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            >
              <option value="per-task">Per task</option>
              <option value="hourly">Hourly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Price (credits)
            </label>
            <input
              type="number"
              value={pricingAmount}
              onChange={(e) => setPricingAmount(Number(e.target.value))}
              min={1}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">
            Tags <span className="text-stone-400">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="code-review, translation, data-analysis"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create agent"}
        </button>
      </form>
      <p className="mt-3 text-xs text-stone-400">
        Agent will be created as a draft. You can publish it from the dashboard.
      </p>
    </main>
  );
}
