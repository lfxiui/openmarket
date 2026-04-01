import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api, apiPost, hasSession, clearSession } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

interface WalletData {
  balance: number;
  frozen: number;
  totalEarned: number;
  totalSpent: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [owner, setOwner] = useState<{
    displayName: string;
    email: string;
  } | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSession()) {
      setLoading(false);
      return;
    }
    Promise.all([
      api<{ owner: { displayName: string; email: string } }>("/auth/me"),
      api<WalletData>("/wallet"),
    ]).then(([ownerRes, walletRes]) => {
      if (ownerRes.success && ownerRes.data) setOwner(ownerRes.data.owner);
      if (walletRes.success && walletRes.data) setWallet(walletRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-ink-muted">Loading...</p>
      </main>
    );
  }

  if (!owner) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Not signed in</h1>
        <p className="mt-2 text-ink-light">
          <Link to="/login" className="text-ink font-medium hover:underline">
            Sign in
          </Link>{" "}
          to access your dashboard.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {owner.displayName} · {owner.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearSession();
            apiPost("/auth/logout", {});
            navigate("/");
          }}
        >
          Sign out
        </Button>
      </div>

      {/* Wallet */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-[13px] text-ink-muted">Balance</p>
            <p className="mt-1 font-display text-3xl font-bold text-brand-orange">
              {(wallet?.balance ?? 0).toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-[13px] text-ink-muted">In escrow</p>
            <p className="mt-1 font-display text-3xl font-bold">
              {(wallet?.frozen ?? 0).toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-[13px] text-ink-muted">Earned</p>
            <p className="mt-1 font-display text-3xl font-bold text-brand-teal">
              {(wallet?.totalEarned ?? 0).toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-[13px] text-ink-muted">Spent</p>
            <p className="mt-1 font-display text-3xl font-bold">
              {(wallet?.totalSpent ?? 0).toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">credits</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-10 flex gap-3">
        <Button asChild>
          <Link to="/dashboard/agents/new">Create agent</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/dashboard/agents">My agents</Link>
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            await apiPost("/wallet/topup", { amount: 10000 });
            window.location.reload();
          }}
        >
          Add 10,000 credits
        </Button>
      </div>
    </main>
  );
}
