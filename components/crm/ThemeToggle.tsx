"use client";

import { useEffect, useState } from "react";

type Pref = "auto" | "light" | "dark";

function resolve(pref: Pref): "light" | "dark" {
  if (pref === "auto") {
    const h = new Date().getHours();
    return h >= 6 && h < 18 ? "light" : "dark";
  }
  return pref;
}

function apply(pref: Pref) {
  const el = document.documentElement;
  el.dataset.theme = resolve(pref);
  el.dataset.themePref = pref;
  try {
    localStorage.setItem("eby-theme", pref);
  } catch {
    /* ignore */
  }
}

const OPTIONS: { key: Pref; label: string; icon: string }[] = [
  { key: "auto", label: "Auto", icon: "M12 3a9 9 0 1 0 9 9h-9z" },
  { key: "light", label: "Light", icon: "M12 4v2M12 18v2M4 12h2M18 12h2M6 6l1.5 1.5M16.5 16.5L18 18M6 18l1.5-1.5M16.5 7.5L18 6" },
  { key: "dark", label: "Dark", icon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" },
];

export function ThemeToggle() {
  const [pref, setPref] = useState<Pref>("auto");

  useEffect(() => {
    const current = (document.documentElement.dataset.themePref as Pref) || "auto";
    setPref(current);
  }, []);

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-line bg-card p-0.5">
      {OPTIONS.map((o) => {
        const active = pref === o.key;
        return (
          <button
            key={o.key}
            type="button"
            title={`Theme: ${o.label}`}
            aria-label={`Theme: ${o.label}`}
            onClick={() => {
              setPref(o.key);
              apply(o.key);
            }}
            className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
              active ? "bg-primary text-primary-contrast" : "text-ink-muted hover:text-ink"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path d={o.icon} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              {o.key === "light" && <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
