import Link from "next/link";
import { labelColor, ownerColor } from "@/lib/colors";
import { BackButton } from "./BackButton";

/** A colored pill for any enum value (segment, stage, status, etc.). */
export function Badge({
  value,
  kind = "label",
  className = "",
}: {
  value: string | null | undefined;
  kind?: "label" | "owner";
  className?: string;
}) {
  if (!value) return <span className="text-ink-muted">—</span>;
  const c = kind === "owner" ? ownerColor(value) : labelColor(value);
  return (
    <span
      className={`chip ${className}`}
      style={{ backgroundColor: `${c}22`, color: c, boxShadow: `inset 0 0 0 1px ${c}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />
      {value}
    </span>
  );
}

/** Initials avatar for an owner. */
export function OwnerAvatar({ owner, size = 24 }: { owner: string | null; size?: number }) {
  if (!owner) return null;
  const initials = owner.slice(0, 2).toUpperCase();
  const c = ownerColor(owner);
  return (
    <span
      title={owner}
      className="inline-flex items-center justify-center rounded-full font-semibold text-ink ring-1 ring-line"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${c}, ${c}99)`,
      }}
    >
      {initials}
    </span>
  );
}

/** Hover help: a small "?" that reveals an explanation on hover. */
export function HelpTip({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <span className="group relative inline-flex align-middle">
      <span className="ml-1 inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-slate-500/70 text-[9px] leading-none text-ink-muted">
        ?
      </span>
      <span className="pointer-events-none absolute left-1/2 top-5 z-50 hidden w-52 -translate-x-1/2 rounded-md border border-line bg-card px-2.5 py-1.5 text-xs font-normal leading-snug text-ink-soft shadow-card group-hover:block">
        {text}
      </span>
    </span>
  );
}

/** The 7-digit human ID, styled as a quiet monospace tag. */
export function IdTag({ id }: { id: string | null | undefined }) {
  if (!id) return null;
  return <span className="font-mono text-[11px] tracking-tight text-ink-muted">{id}</span>;
}

/** Page header with title, optional subtitle, and right-aligned actions. */
export function PageHeader({
  title,
  subtitle,
  children,
  back,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  back?: boolean;
}) {
  return (
    <div className="mb-6">
      {back && <BackButton />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}

/** Empty-state card. */
export function EmptyState({ message, cta }: { message: string; cta?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="text-sm text-ink-muted">{message}</p>
      {cta}
    </div>
  );
}

/** A read-only labelled value, used on detail pages. */
export function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const empty =
    children == null || children === "" || (Array.isArray(children) && children.length === 0);
  return (
    <div className="border-b border-line-soft py-2.5">
      <div className="label-eyebrow mb-1">{label}</div>
      <div className="text-sm text-ink-soft">{empty ? <span className="text-ink-muted">—</span> : children}</div>
    </div>
  );
}

export { Link };
