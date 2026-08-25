export default function Loading() {
  return (
    <main
      className="mx-auto max-w-[1400px] animate-pulse px-4 py-9 sm:px-7 lg:px-10"
      aria-label="Loading business dashboard"
    >
      <div className="h-4 w-40 rounded bg-[var(--surface-2)]" />
      <div className="mt-4 h-10 w-[min(100%,32rem)] rounded bg-[var(--surface-2)]" />
      <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-36 rounded-2xl bg-[var(--surface-2)]"
          />
        ))}
      </div>
      <div className="mt-3 h-80 rounded-2xl bg-[var(--surface-2)]" />
    </main>
  );
}
