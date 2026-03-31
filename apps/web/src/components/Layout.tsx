import { Link, Outlet } from "react-router";
import { hasSession } from "../lib/utils";
import { Button } from "./ui/Button";

export function Layout() {
  const loggedIn = hasSession();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-cream/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-48.png" alt="OpenMarket" className="h-7 w-7" />
            <span className="font-display text-[15px] font-semibold tracking-tight">
              OpenMarket
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/agents">Marketplace</Link>
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
