import Link from "next/link";
import { ScanLine } from "lucide-react";
import { customerAppUrl } from "@/lib/site";

/**
 * What a mis-scanned poster should say.
 *
 * Without this the route fell through to the site-wide 404, which reads "this
 * page is not part of the route - the link may have moved". The page is fine.
 * The code is not, and the person reading it is standing at a counter with a
 * phone in their hand, so the sentence has to be about the code and the next
 * thing to do about it.
 */
export default function JoinNotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[560px] flex-col justify-center px-4 py-20 sm:px-6">
      <span className="grid size-12 place-items-center rounded-2xl bg-[var(--surface-2)]">
        <ScanLine size={22} />
      </span>
      <h1 className="mt-6 text-4xl font-extrabold tracking-[-0.03em]">
        We could not find that join code.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[var(--muted-strong)]">
        The code on the poster did not match a shop. Scanning again usually
        fixes it — a camera that catches the code at an angle can read a digit
        wrong. If it keeps failing, the staff at the counter can add you
        directly and you will not lose the visit.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={`${customerAppUrl}/login`}
          className="focus-ring rounded-xl bg-[var(--ink)] px-5 py-3 text-sm font-bold text-[var(--surface)]"
        >
          Open my wallet
        </a>
        <Link
          href="/product"
          className="focus-ring rounded-xl border border-[var(--line-strong)] px-5 py-3 text-sm font-bold"
        >
          What is KYPStamping?
        </Link>
      </div>
    </main>
  );
}
