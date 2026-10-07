import { Skeleton } from "@kyprewards/ui";

export default function Loading() {
  return (
    <div className="px-4 sm:px-6 lg:px-8" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="mx-auto max-w-[1200px] py-12 lg:py-16">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-5 h-12 w-2/3 max-w-[520px]" />
        <Skeleton className="mt-4 h-5 w-full max-w-[560px]" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}
