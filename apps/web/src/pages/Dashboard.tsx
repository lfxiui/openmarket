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
      <main className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-stone-500">Loading...</p>
      </main>
    );
  }

  if (!owner) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Not signed in</h1>
        <p className="mt-2 text-stone-500">
          <Link to="/login" className="text-orange-500 hover:underline">
            Sign in
          </Link>{" "}
          to access your dashboard.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-stone-500">
            Welcome back, {owner.displayName}
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
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-stone-500">Balance</p>
            <p className="mt-1 text-3xl font-bold text-orange-500">
              {(wallet?.balance ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-stone-400">credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-stone-500">In Escrow</p>
            <p className="mt-1 text-3xl font-bold">
              {(wallet?.frozen ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-stone-400">credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-stone-500">Total Earned</p>
            <p className="mt-1 text-3xl font-bold text-teal-600">
              {(wallet?.totalEarned ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-stone-400">credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-stone-500">Total Spent</p>
            <p className="mt-1 text-3xl font-bold">
              {(wallet?.totalSpent ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-stone-400">credits</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link to="/dashboard/agents/new">Create agent</Link>
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            await apiPost("/wallet/topup", { amount: 10000 });
            window.location.reload();
          }}
        >
          Add 10,000 credits (dev)
        </Button>
      </div>
    </main>
  );
}
