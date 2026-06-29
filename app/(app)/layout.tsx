import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/crm/Sidebar";
import { Topbar } from "@/components/crm/Topbar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="card max-w-lg p-8">
          <h1 className="text-lg font-semibold text-ink">Almost there</h1>
          <p className="mt-2 text-sm text-ink-muted">
            The app is running but not yet connected to its database. Add your Supabase
            keys (see <span className="font-mono text-ink-soft">docs/SETUP.md</span>) and
            reload.
          </p>
        </div>
      </div>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar email={user?.email ?? null} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
