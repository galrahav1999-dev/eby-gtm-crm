import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge } from "@/components/crm/ui";
import { AudioUploader } from "./AudioUploader";

export const dynamic = "force-dynamic";
// Transcribing several recordings can take a while; allow a longer function run.
export const maxDuration = 300;

export default async function LoggerPage() {
  const aiOn = !!process.env.ANTHROPIC_API_KEY;
  const sttOn = !!process.env.OPENAI_API_KEY;

  const supabase = createClient();
  const { data: recent } = await supabase
    .from("ai_ingestions")
    .select("id, display_id, source_type, status, created_at, transcript")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div>
      <PageHeader
        title="AI logger"
        subtitle="Capture a call as audio or notes. The AI drafts records mapped to your fields, you review and edit every field, then accept. Nothing is saved until you do."
      />

      {!aiOn && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
          The AI logger is off until <span className="font-mono">ANTHROPIC_API_KEY</span> is set. You can still see past runs below.
        </div>
      )}

      <AudioUploader sttOn={sttOn} />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">Recent runs</h2>
        {recent && recent.length > 0 ? (
          <div className="card divide-y divide-line">
            {recent.map((r) => (
              <Link key={r.id} href={`/logger/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-surface-muted">
                <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                  {r.source_type === "audio" ? "Recording" : "Notes"} ·{" "}
                  <span className="text-ink-muted">{(r.transcript ?? "").slice(0, 80) || "—"}</span>
                </span>
                <Badge value={r.status} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No runs yet.</p>
        )}
      </section>
    </div>
  );
}
