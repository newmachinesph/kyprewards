import {
  BarChart3,
  Bell,
  Gift,
  QrCode,
  ScanLine,
  Stamp,
  UserPlus,
  Users,
} from "lucide-react";

export function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface)] text-[var(--ink)] shadow-[0_30px_100px_rgb(0_0_0/28%)]">
      <div className="flex h-12 items-center gap-2 border-b border-[var(--line)] px-4">
        <span className="size-2.5 rounded-full bg-[var(--line-strong)]" />
        <span className="size-2.5 rounded-full bg-[var(--line-strong)]" />
        <span className="size-2.5 rounded-full bg-[var(--accent)]" />
        <span className="ml-2 rounded-full bg-[var(--surface-2)] px-3 py-1 font-mono text-[9px] text-[var(--muted)]">
          business.stampr.com
        </span>
      </div>
      <div className="grid min-h-[430px] grid-cols-[76px_1fr] sm:grid-cols-[150px_1fr]">
        <aside className="border-r border-[var(--line)] bg-[var(--paper)] p-3">
          <span className="block size-8 overflow-hidden rounded-lg ring-1 ring-[var(--line)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.png" alt="" width={32} height={32} className="size-full object-cover" />
          </span>
          <div className="mt-8 space-y-2">
            {[BarChart3, ScanLine, Users, Gift].map((Icon, index) => (
              <span
                key={index}
                className={`flex h-9 items-center gap-2 rounded-xl px-2 ${index === 0 ? "bg-[var(--ink)] text-[var(--paper)]" : "text-[var(--muted)]"}`}
              >
                <Icon size={14} />{" "}
                <span className="hidden text-[9px] font-bold sm:block">
                  {["Overview", "Scan", "Customers", "Rewards"][index]}
                </span>
              </span>
            ))}
          </div>
        </aside>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Good morning
              </p>
              <p className="mt-1 text-lg font-black tracking-[-0.04em]">
                Sweet Crumbs
              </p>
            </div>
            <span className="grid size-8 place-items-center rounded-full border border-[var(--line)]">
              <Bell size={14} />
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              { label: "Visits", value: "128", icon: Users },
              { label: "New regulars", value: "24", icon: UserPlus },
              { label: "Stamps", value: "216", icon: Stamp },
              { label: "Rewards", value: "18", icon: Gift },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-3 ${index === 0 ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--line)]"}`}
                >
                  <Icon
                    size={14}
                    className={
                      index === 0
                        ? "text-[var(--accent)]"
                        : "text-[var(--muted)]"
                    }
                  />
                  <p
                    className={`mt-4 text-[9px] ${index === 0 ? "text-white/65" : "text-[var(--muted)]"}`}
                  >
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xl font-black">{item.value}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-2 rounded-2xl border border-[var(--line)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold">Today&apos;s rhythm</span>
              <QrCode size={14} className="text-[var(--muted)]" />
            </div>
            <div className="mt-6 flex h-20 items-end gap-1.5">
              {[24, 38, 30, 55, 46, 66, 58, 78, 64, 88].map((height, index) => (
                <span
                  key={index}
                  className={`flex-1 rounded-t-sm ${index === 9 ? "bg-[var(--accent)]" : "bg-[var(--ink)]"}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
