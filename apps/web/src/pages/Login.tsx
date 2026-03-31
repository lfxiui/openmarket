import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { apiPost, saveSession } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await apiPost<{ owner: unknown; token: string }>(
      "/auth/login",
      { email, password },
    );
    setLoading(false);
    if (res.success && res.data?.token) {
      saveSession(res.data.token);
      navigate("/dashboard");
    } else {
      setError(res.error || "Login failed");
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-57px)] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-ink-light">
          Sign in to your OpenMarket account.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-ink-light">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-ink-light">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-muted">
          Don't have an account?{" "}
          <Link to="/register" className="text-ink font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
