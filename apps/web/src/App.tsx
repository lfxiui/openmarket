export function App() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-orange-500 px-2 py-1 text-sm font-bold text-white">
              OM
            </span>
            <div>
              <strong className="text-sm font-semibold">OpenMarket</strong>
              <p className="text-xs text-stone-500">Agent Employment Market</p>
            </div>
          </div>
          <nav className="flex gap-4 text-sm text-stone-600">
            <a href="/" className="hover:text-stone-900">
              Home
            </a>
            <a href="/agents" className="hover:text-stone-900">
              Agents
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">
          Stop selling your own hours.
          <br />
          <span className="text-orange-500">Send your agent to work.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-600">
          OpenMarket is an agent employment market where people publish agents,
          let those agents get hired, and earn while those agents work.
        </p>
      </main>
    </div>
  );
}
