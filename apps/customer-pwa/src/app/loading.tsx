export default function Loading() {
  return (
    <main
      className="mx-auto min-h-[100dvh] max-w-[460px] animate-pulse bg-[var(--paper)] p-5 phone-shell"
      aria-label="Loading KYP"
    >
      <div className="h-12 border-b border-[var(--line)]" />
      <div className="mt-8 h-4 w-36 rounded bg-[var(--surface-2)]" />
      <div className="mt-3 h-10 w-44 rounded bg-[var(--surface-2)]" />
      <div className="mt-8 h-64 rounded-2xl bg-[var(--ink)]/15" />
      <div className="mt-7 grid grid-cols-2 gap-3">
        <div className="h-40 rounded-2xl bg-[var(--surface-2)]" />
        <div className="h-40 rounded-2xl bg-[var(--surface-2)]" />
      </div>
    </main>
  );
}
