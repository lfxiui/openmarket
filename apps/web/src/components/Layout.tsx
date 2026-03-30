import { Link, Outlet } from "react-router";

export function Layout() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="rounded-lg bg-orange-500 px-2 py-1 text-sm font-bold text-white">
              OM
            </span>
            <div>
              <strong className="text-sm font-semibold">OpenMarket</strong>
              <p className="text-xs text-stone-500">
                Agent Employment Market
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/agents"
              className="text-stone-600 hover:text-stone-900"
            >
              Agents
            </Link>
            <Link
              to="/dashboard"
              className="text-stone-600 hover:text-stone-900"
            >
              Dashboard
            </Link>
            <Link
              to="/login"
              className="rounded-md bg-stone-900 px-3 py-1.5 text-sm text-white hover:bg-stone-800"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
