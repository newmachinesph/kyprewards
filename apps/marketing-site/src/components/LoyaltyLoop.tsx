/**
 * The loyalty loop, as a scene.
 *
 * The hero used to show one receipt; what a shop owner is actually buying is a
 * cycle, so this draws it: the customer's phone on a podium in the middle,
 * and the five moments of a visit around it, each with its own object. On
 * wide screens the five sit on a ring; under 1024px the ring would not fit, so
 * the same five become a list and nothing is lost.
 *
 * The labels are the site's own facts, shortened: the poster, the welcome
 * stamp the staff make real, the reward that is held, the return visit, and
 * the owner finally knowing who comes back.
 */

/**
 * Where each step sits on the ring, as an angle in degrees (0 = right,
 * clockwise), and which side of the object its label goes. The ring's radius
 * is 300 in a 760 box, so a node centre is 39.5% out from the middle.
 */
const STEPS = [
  {
    n: 1,
    label: "Customer scans your poster",
    image: "/images/obj-poster.webp",
    angle: 216,
    labelSide: "left",
  },
  {
    n: 2,
    label: "Staff confirm the visit",
    image: "/images/obj-stamp.webp",
    angle: 324,
    labelSide: "right",
  },
  {
    n: 3,
    label: "The reward is held for them",
    image: "/images/obj-gift.webp",
    angle: 28,
    labelSide: "right",
  },
  {
    n: 4,
    label: "They come back",
    image: "/images/obj-return.webp",
    angle: 90,
    labelSide: "right",
  },
  {
    n: 5,
    label: "You know who returns",
    image: "/images/obj-chart.webp",
    angle: 152,
    labelSide: "left",
  },
] as const;

const RADIUS = 39.5;

function nodeStyle(angle: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    left: `${50 + RADIUS * Math.cos(rad)}%`,
    top: `${50 + RADIUS * Math.sin(rad)}%`,
  };
}

function StepPill({ n, label }: { n: number; label: string }) {
  return (
    <span className="shadow-soft inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--surface)] py-2 pl-2 pr-4 text-sm font-extrabold tracking-[-0.01em]">
      <span className="grid size-7 place-items-center rounded-full bg-[var(--ink)] text-[11px] text-[var(--accent)]">
        {n}
      </span>
      {label}
    </span>
  );
}

export function LoyaltyLoop() {
  return (
    <div className="relative">
      {/* Wide: the ring. */}
      <div
        className="relative mx-auto hidden aspect-square w-full max-w-[760px] lg:block"
        role="img"
        aria-label="The loyalty loop: a customer scans the poster, staff confirm the visit, the reward is held for them, they come back, and you know who returns."
      >
        <svg
          viewBox="0 0 760 760"
          className="absolute inset-0 size-full"
          aria-hidden="true"
        >
          <circle cx="380" cy="380" r="300" className="loop-ring" />
          {/* Three arrowheads on the ring, pointing clockwise. */}
          {[20, 140, 260].map((deg) => (
            <path
              key={deg}
              d="M -14 -12 L 0 0 L -14 12"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={`rotate(${deg} 380 380) translate(380 80)`}
            />
          ))}
        </svg>

        {/* Centre: the phone on its podium. */}
        <div className="absolute left-1/2 top-1/2 w-[300px] -translate-x-1/2 -translate-y-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/obj-phone-podium.webp"
            alt="A phone on a podium showing a stamp card with five of eight stamps collected"
            width={800}
            height={800}
            fetchPriority="high"
            className="drift block w-full"
          />
        </div>

        {STEPS.map((step) => (
          <div
            key={step.n}
            style={nodeStyle(step.angle)}
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 ${step.labelSide === "left" ? "flex-row-reverse" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={step.image}
              alt=""
              aria-hidden="true"
              width={800}
              height={800}
              loading="lazy"
              decoding="async"
              className={`${step.n % 2 ? "drift" : "drift-late"} w-[112px] shrink-0`}
            />
            <StepPill n={step.n} label={step.label} />
          </div>
        ))}
      </div>

      {/* Narrow: the same five, as a list beside the phone. */}
      <div className="lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/obj-phone-podium.webp"
          alt="A phone on a podium showing a stamp card with five of eight stamps collected"
          width={800}
          height={800}
          fetchPriority="high"
          className="mx-auto block w-[220px]"
        />
        <ol className="mx-auto mt-6 grid max-w-[520px] gap-2">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="shadow-soft flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 pr-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={step.image}
                alt=""
                aria-hidden="true"
                width={800}
                height={800}
                loading="lazy"
                decoding="async"
                className="size-14 shrink-0"
              />
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-[11px] font-extrabold text-[var(--accent)]">
                {step.n}
              </span>
              <span className="text-sm font-extrabold tracking-[-0.01em]">
                {step.label}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
