import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, Badge, OwnerAvatar } from "@/components/crm/ui";

export const dynamic = "force-dynamic";

function when(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const actionColor: Record<string, string> = {
  create: "Created",
  update: "Edited",
  delete: "Deleted",
};

export default async function ActivityPage() {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("audit_log")
    .select("id, actor_email, actor_name, action, table_name, display_id, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(150);

  return (
    <div>
      <PageHeader
        title="Activity"
        subtitle="Every create, edit, and delete. The team's audit trail for KPIs and troubleshooting."
      />
      {rows && rows.length > 0 ? (
        <div className="card divide-y divide-line">
          {rows.map((r) => {
            const who = r.actor_name || r.actor_email || "Someone";
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <OwnerAvatar owner={who.slice(0, 2)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-soft">{r.summary}</span>
                    {r.display_id && (
                      <span className="font-mono text-[10px] text-ink-muted">{r.display_id}</span>
                    )}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {who} · {actionColor[r.action] ?? r.action} · {r.table_name}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-ink-muted">{when(r.created_at)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState message="No activity logged yet. Create or edit a record and it shows up here." />
      )}
    </div>
  );
}
