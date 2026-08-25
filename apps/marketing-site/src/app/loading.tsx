export default function Loading() {
  return (
    <main className="min-h-[100dvh] animate-pulse" aria-label="Loading page">
      <div className="site-grid border-b border-[var(--line)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid min-h-[420px] max-w-[1400px] items-end gap-12 lg:grid-cols-2">
          <div>
            <div className="h-4 w-32 rounded bg-[var(--surface-2)]" />
            <div className="mt-6 h-16 w-[min(100%,38rem)] rounded bg-[var(--surface-2)]" />
            <div className="mt-3 h-16 w-[min(80%,28rem)] rounded bg-[var(--surface-2)]" />
          </div>
          <div>
            <div className="h-5 w-full max-w-lg rounded bg-[var(--surface-2)]" />
            <div className="mt-3 h-5 w-3/4 rounded bg-[var(--surface-2)]" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-80 rounded-2xl bg-[var(--surface-2)]" />
          <div className="h-80 rounded-2xl bg-[var(--surface-2)]" />
        </div>
      </div>
    </main>
  );
}
