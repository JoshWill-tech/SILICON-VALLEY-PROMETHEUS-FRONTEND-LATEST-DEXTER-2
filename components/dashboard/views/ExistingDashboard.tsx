const cards = [
  { label: "Active Projects", value: "3", detail: "Production workspace" },
  { label: "Exports", value: "12", detail: "Ready this week" },
  { label: "Review Queue", value: "5", detail: "Awaiting approval" },
];

export function ExistingDashboard() {
  return (
    <main className="flex h-full flex-col justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-5xl">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-accent-cyan">Workspace</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-normal text-text-primary md:text-6xl">
          Command center for production work.
        </h1>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <section key={card.label} className="glass-panel rounded-lg p-5">
              <p className="text-xs uppercase tracking-wider text-text-tertiary">{card.label}</p>
              <p className="mt-3 font-mono text-3xl text-text-primary">{card.value}</p>
              <p className="mt-2 text-sm text-text-secondary">{card.detail}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
