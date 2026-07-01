"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { REGISTRY } from "@/lib/schema/registry";
import type { OptionsMap } from "@/lib/options";
import { FieldInput, type FkData } from "./RecordForm";
import { quickCreateAction } from "@/lib/record-actions";
import type { FieldDef } from "@/lib/schema/types";

interface Bundle {
  options: OptionsMap;
  fk: Record<string, FkData>;
}
interface Toast {
  displayId: string;
  href: string;
}

// Fields whose value carries over to the next "add another", so logging a run of
// records for one owner stays fast.
const STICKY = ["owner", "segment"];

export function QuickAddDrawer() {
  const router = useRouter();
  const [object, setObject] = useState<string | null>(null);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [sticky, setSticky] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const def = object ? REGISTRY[object] : null;
  const fields: FieldDef[] = def
    ? (def.quickCreate ?? []).map((n) => def.fields.find((f) => f.name === n)).filter(Boolean) as FieldDef[]
    : [];

  const close = useCallback(() => {
    setObject(null);
    setBundle(null);
    setError(null);
    setSticky({});
  }, []);

  // Open on the global quick-add event (dispatched by the command palette).
  useEffect(() => {
    function onOpen(e: Event) {
      const key = (e as CustomEvent).detail?.object as string | undefined;
      if (key && REGISTRY[key]) {
        setSticky({});
        setFormKey((k) => k + 1);
        setObject(key);
      }
    }
    window.addEventListener("eby:quickadd", onOpen as EventListener);
    return () => window.removeEventListener("eby:quickadd", onOpen as EventListener);
  }, []);

  // Close on Escape.
  useEffect(() => {
    if (!object) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [object, close]);

  // Load options + FK data for the chosen object.
  useEffect(() => {
    if (!object) return;
    let alive = true;
    setLoading(true);
    setBundle(null);
    fetch(`/api/form-bundle/${object}`)
      .then((r) => r.json())
      .then((j) => {
        if (alive) setBundle({ options: j.options ?? {}, fk: j.fk ?? {} });
      })
      .catch(() => alive && setError("Could not load the form. Try again."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [object]);

  async function submit(addAnother: boolean) {
    if (!object || !formRef.current) return;
    const fd = new FormData(formRef.current);
    setSubmitting(true);
    setError(null);
    try {
      const res = await quickCreateAction(object, fd);
      setToast({ displayId: res.displayId, href: `/${object}/${res.id}` });
      router.refresh();
      if (addAnother) {
        const next: Record<string, string> = {};
        for (const k of STICKY) {
          const v = fd.get(k);
          if (typeof v === "string" && v) next[k] = v;
        }
        setSticky(next);
        setFormKey((k) => k + 1); // remount fields to clear them
      } else {
        close();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSubmitting(false);
    }
  }

  // Auto-dismiss the toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      {object && def && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <button
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 cursor-default"
            style={{ background: "color-mix(in srgb, var(--ink) 40%, transparent)" }}
          />
          <div className="animate-rise relative flex h-full w-full max-w-[440px] flex-col border-l border-line bg-card shadow-pop">
            <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
              <div>
                <div className="label-eyebrow">Quick add</div>
                <h2 className="text-base font-semibold text-ink">New {def.singular.toLowerCase()}</h2>
              </div>
              <button onClick={close} className="text-sm text-ink-muted hover:text-ink">
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading || !bundle ? (
                <div className="space-y-3">
                  <div className="skeleton h-9 w-full rounded-lg" />
                  <div className="skeleton h-9 w-full rounded-lg" />
                  <div className="skeleton h-9 w-2/3 rounded-lg" />
                </div>
              ) : (
                <form ref={formRef} key={formKey} onSubmit={(e) => e.preventDefault()} className="space-y-4">
                  {fields.map((f) => (
                    <FieldInput
                      key={f.name}
                      field={f}
                      value={STICKY.includes(f.name) ? sticky[f.name] : undefined}
                      options={bundle.options}
                      fk={f.fkTo ? bundle.fk[f.fkTo] : undefined}
                    />
                  ))}
                </form>
              )}
              {error && (
                <p
                  className="mt-3 rounded-lg px-3 py-2 text-sm text-danger"
                  style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}
                >
                  {error}
                </p>
              )}
            </div>

            <div className="border-t border-line-soft px-5 py-4">
              <div className="flex items-center gap-2">
                <button onClick={() => submit(false)} disabled={submitting || !bundle} className="btn-primary">
                  {submitting ? "Saving…" : "Save"}
                </button>
                <button onClick={() => submit(true)} disabled={submitting || !bundle} className="btn-ghost">
                  Save and add another
                </button>
              </div>
              <Link
                href={`/${object}/new`}
                onClick={close}
                className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
              >
                Open the full form for every field →
              </Link>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[60]">
          <div className="card flex items-center gap-3 px-4 py-3 shadow-pop">
            <span className="text-sm text-ink">Created {toast.displayId}</span>
            <Link href={toast.href} onClick={() => setToast(null)} className="text-sm font-medium text-primary hover:underline">
              Open
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
