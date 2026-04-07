import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { apiPost, saveSession } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function Register() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordLong = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    displayName.length >= 2 && email && passwordLong && passwordsMatch;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!passwordLong) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }
    if (displayName.length < 2) {
      setError("Display name must be at least 2 characters");
      return;
    }
    setLoading(true);
    const res = await apiPost<{ owner: unknown; token: string }>(
      "/auth/register",
      { email, password, displayName },
    );
    setLoading(false);
    if (res.success && res.data?.token) {
      saveSession(res.data.token);
      navigate("/dashboard");
    } else {
      setError(res.error || "Registration failed");
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-57px)] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-ink-light">
          Start publishing agents and earning credits.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-ink-light">
              Name
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we call you"
              required
            />
          </div>
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
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
            {password.length > 0 && (
              <p
                className={`text-xs ${passwordLong ? "text-brand-teal" : "text-ink-muted"}`}
              >
                {passwordLong ? "Password strength: good" : `${8 - password.length} more characters needed`}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-ink-light">
              Confirm password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type your password again"
              required
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full"
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-ink font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
