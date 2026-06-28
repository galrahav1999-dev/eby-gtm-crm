import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge } from "@/components/crm/ui";
import { SubmitButton } from "@/components/crm/form";
import { parseText, parseAudio } from "./actions";

export const dynamic = "force-dynamic";

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
        subtitle="Paste call notes or a transcript, or upload a recording. The AI drafts clean records mapped to your dropdowns. You review before anything is saved."
      />

      {!aiOn && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          The AI logger is off until <span className="font-mono">ANTHROPIC_API_KEY</span> is set. You can still see past runs below.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Paste text */}
        <form action={parseText} className="card p-5">
          <h2 className="mb-1 text-sm font-semibold text-ink">Paste notes or transcript</h2>
          <p className="mb-3 text-xs text-ink-muted">Rough notes or a full speech-to-text transcript both work.</p>
          <textarea
            name="transcript"
            rows={10}
            placeholder="Paste the conversation here…"
            className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary"
          />
          <div className="mt-3">
            <SubmitButton label="Extract records" />
          </div>
        </form>

        {/* Upload audio */}
        <form action={parseAudio} className="card p-5">
          <h2 className="mb-1 text-sm font-semibold text-ink">Upload a recording</h2>
          <p className="mb-3 text-xs text-ink-muted">
            We store the audio, transcribe it, then extract records.
            {!sttOn && " (Needs OPENAI_API_KEY to transcribe.)"}
          </p>
          <input
            type="file"
            name="audio"
            accept="audio/*"
            className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-primary"
          />
          <div className="mt-3">
            <SubmitButton label="Upload & extract" />
          </div>
        </form>
      </div>

      {/* Recent runs */}
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
