"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string; // key in the Icon switch below
  soon?: boolean;
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: "home" },
      { href: "/map", label: "World map", icon: "globe" },
      { href: "/activity", label: "Activity", icon: "pulse" },
    ],
  },
  {
    group: "Records",
    items: [
      { href: "/organizations", label: "Organizations", icon: "building" },
      { href: "/people", label: "People", icon: "users" },
      { href: "/deals", label: "Deals", icon: "deal" },
      { href: "/pilots", label: "Pilots", icon: "flask" },
      { href: "/partners", label: "Partners", icon: "link" },
      { href: "/interactions", label: "Interactions", icon: "chat" },
      { href: "/waitlist", label: "B2C waitlist", icon: "list" },
    ],
  },
  {
    group: "Tools",
    items: [
      { href: "/logger", label: "AI logger", icon: "spark", soon: true },
      { href: "/admin", label: "Admin / lists", icon: "sliders" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-white/5 bg-ink-900/60">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-sm font-bold text-accent-glow ring-1 ring-accent/30">
          ע
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">EBY GTM</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Mission control</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {NAV.map((section) => (
          <div key={section.group}>
            <div className="label-eyebrow px-2 pb-1.5">{section.group}</div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition ${
                        active
                          ? "bg-accent/15 text-white ring-1 ring-accent/25"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                      }`}
                    >
                      <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.soon && (
                        <span className="rounded bg-white/5 px-1 text-[9px] uppercase tracking-wide text-slate-500">
                          soon
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const p: Record<string, string> = {
    home: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5",
    globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18",
    pulse: "M3 12h4l2 6 4-14 2 8h6",
    building: "M4 21V5l8-2v18M12 21V9l8 2v10M8 8v0M8 12v0M8 16v0",
    users: "M16 18v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 7v-1a4 4 0 0 0-3-3.8",
    deal: "M3 7h18v12H3zM3 7l3-4h12l3 4M9 12h6",
    flask: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3",
    link: "M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1",
    chat: "M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z",
    list: "M8 6h13M8 12h13M8 18h13M3 6v0M3 12v0M3 18v0",
    spark: "M12 3v4m0 10v4m9-9h-4M7 12H3m13.5-5.5-2.8 2.8m-5.4 5.4-2.8 2.8m11 0-2.8-2.8M8.3 8.3 5.5 5.5",
    sliders: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d={p[name] ?? p.list} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
