import Link from "next/link";
import { labelColor, ownerColor } from "@/lib/colors";

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
  if (!value) return <span className="text-slate-600">—</span>;
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
      className="inline-flex items-center justify-center rounded-full font-semibold text-white ring-1 ring-white/10"
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

/** The 7-digit human ID, styled as a quiet monospace tag. */
export function IdTag({ id }: { id: string | null | undefined }) {
  if (!id) return null;
  return <span className="font-mono text-[11px] tracking-tight text-slate-500">{id}</span>;
}

/** Page header with title, optional subtitle, and right-aligned actions. */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

/** Empty-state card. */
export function EmptyState({ message, cta }: { message: string; cta?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="text-sm text-slate-400">{message}</p>
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
    <div className="border-b border-white/5 py-2.5">
      <div className="label-eyebrow mb-1">{label}</div>
      <div className="text-sm text-slate-200">{empty ? <span className="text-slate-600">—</span> : children}</div>
    </div>
  );
}

export { Link };
