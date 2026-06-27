import { signOut } from "@/app/(app)/actions";

export function Topbar({ email }: { email: string | null }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-ink-900/40 px-6">
      <div className="text-xs text-slate-500">
        EBY go-to-market workspace · single source of truth
      </div>
      <div className="flex items-center gap-3">
        {email && <span className="text-sm text-slate-300">{email}</span>}
        <form action={signOut}>
          <button type="submit" className="btn-ghost text-xs">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
