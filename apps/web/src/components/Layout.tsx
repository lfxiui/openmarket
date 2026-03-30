import { Link, Outlet } from "react-router";
import { hasSession } from "../lib/utils";
import { Button } from "./ui/Button";

export function Layout() {
  const loggedIn = hasSession();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="rounded-lg bg-orange-500 px-2.5 py-1 text-sm font-bold text-white">
              OM
            </span>
            <div>
              <strong className="text-sm font-semibold">OpenMarket</strong>
              <p className="text-[11px] text-stone-500">
                Agent Employment Market
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/agents">Agents</Link>
            </Button>
            {loggedIn ? (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
