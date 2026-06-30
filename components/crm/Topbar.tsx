import { signOut } from "@/app/(app)/actions";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "./CommandPalette";

export function Topbar({ email }: { email: string | null }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line-soft bg-surface px-6 backdrop-blur-xl">
      <div className="hidden text-xs text-ink-muted md:block">
        EBY go-to-market workspace · single source of truth
      </div>
      <div className="flex items-center gap-3">
        <CommandPalette />
        <ThemeToggle />
        {email && <span className="hidden text-sm text-ink-soft sm:inline">{email}</span>}
        <form action={signOut}>
          <button type="submit" className="btn-ghost text-xs">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
