export default function Loading() {
  return (
    <main
      className="admin-canvas min-h-[100dvh] animate-pulse p-7 lg:p-10"
      aria-label="Loading platform dashboard"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="h-4 w-36 rounded bg-[var(--surface-2)]" />
        <div className="mt-4 h-11 w-72 rounded bg-[var(--surface-2)]" />
        <div className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-[var(--surface-2)]"
            />
          ))}
        </div>
        <div className="mt-3 h-80 rounded-2xl bg-[var(--surface-2)]" />
      </div>
    </main>
  );
}
