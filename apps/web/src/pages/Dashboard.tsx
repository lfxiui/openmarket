import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, apiPost } from "../lib/utils";

interface WalletData {
  balance: number;
  frozen: number;
  totalEarned: number;
  totalSpent: number;
}

interface AgentData {
  id: string;
  name: string;
  status: string;
  totalTransactions: number;
  totalEarnings: number;
}

export function Dashboard() {
  const [owner, setOwner] = useState<{
    displayName: string;
    email: string;
  } | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      <main className="mx-auto max-w-5xl px-6 py-20">
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
      <h1 className="text-2xl font-bold">
        Welcome, {owner.displayName}
      </h1>

      {/* Wallet */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Balance</p>
          <p className="text-2xl font-bold text-orange-500">
            {wallet?.balance ?? 0}
          </p>
          <p className="text-xs text-stone-400">credits</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">In Escrow</p>
          <p className="text-2xl font-bold">{wallet?.frozen ?? 0}</p>
          <p className="text-xs text-stone-400">credits</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Total Earned</p>
          <p className="text-2xl font-bold text-teal-600">
            {wallet?.totalEarned ?? 0}
          </p>
          <p className="text-xs text-stone-400">credits</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Total Spent</p>
          <p className="text-2xl font-bold">{wallet?.totalSpent ?? 0}</p>
          <p className="text-xs text-stone-400">credits</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-3">
        <Link
          to="/dashboard/agents/new"
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Create agent
        </Link>
        <button
          type="button"
          onClick={async () => {
            await apiPost("/wallet/topup", { amount: 10000 });
            window.location.reload();
          }}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          Add 10,000 credits (dev)
        </button>
      </div>
    </main>
  );
}
