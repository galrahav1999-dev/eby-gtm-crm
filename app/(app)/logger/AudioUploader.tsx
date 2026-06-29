"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseAudioPath } from "./actions";

/**
 * Uploads the recording directly from the browser to Supabase Storage (no
 * server-action body-size limit), then asks the server to transcribe and
 * extract from the stored file and navigates to the review page.
 */
export function AudioUploader({ sttOn }: { sttOn: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"idle" | "uploading" | "working">("idle");
  const [err, setErr] = useState<string | null>(null);

  const busy = stage !== "idle";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErr("Choose an audio file first.");
      return;
    }
    setErr(null);
    setStage("uploading");
    try {
      const supabase = createClient();
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error } = await supabase.storage
        .from("recordings")
        .upload(path, file, { contentType: file.type || "audio/mpeg", upsert: false });
      if (error) throw new Error(error.message);
      setStage("working");
      const { id } = await parseAudioPath(path, file.name);
      router.push(`/logger/${id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
      setStage("idle");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5">
      <h2 className="mb-1 text-sm font-semibold text-ink">Upload a recording</h2>
      <p className="mb-3 text-xs text-ink-muted">
        Works with iPhone voice memos and other audio. We store it, transcribe it, then draft records.
        {!sttOn && " (Needs OPENAI_API_KEY to transcribe.)"}
      </p>
      <input
        type="file"
        accept="audio/*"
        disabled={busy}
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setErr(null);
        }}
        className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-ink-soft"
      />
      {err && (
        <p
          className="mt-3 rounded-lg px-3 py-2 text-xs text-danger"
          style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}
        >
          {err}
        </p>
      )}
      <div className="mt-3">
        <button type="submit" disabled={busy} className="btn-primary">
          {stage === "uploading" ? "Uploading…" : stage === "working" ? "Transcribing…" : "Upload & extract"}
        </button>
      </div>
    </form>
  );
}
