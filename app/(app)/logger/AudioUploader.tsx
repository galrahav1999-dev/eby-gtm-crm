"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createUploadTarget, parseAudioPath } from "./actions";

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Drag-and-drop (or click) audio upload. Uploads directly to Storage via a
 * server-issued signed URL (no session or body-size limit), then asks the
 * server to transcribe and extract, and navigates to the review page.
 */
export function AudioUploader({ sttOn }: { sttOn: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<"idle" | "uploading" | "working">("idle");
  const [err, setErr] = useState<string | null>(null);

  const busy = stage !== "idle";

  function pick(f: File | null) {
    setErr(null);
    if (!f) return;
    if (!f.type.startsWith("audio/") && !/\.(m4a|mp3|wav|aac|ogg|webm|mp4)$/i.test(f.name)) {
      setErr("That does not look like an audio file. Use an iPhone voice memo or an audio recording.");
      return;
    }
    setFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    pick(e.dataTransfer.files?.[0] ?? null);
  }

  async function submit() {
    if (!file || busy) return;
    setErr(null);
    setStage("uploading");
    try {
      const { path, token } = await createUploadTarget(file.name);
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("recordings")
        .uploadToSignedUrl(path, token, file, { contentType: file.type || "audio/mpeg" });
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
    <div className="card p-5">
      <h2 className="mb-1 text-sm font-semibold text-ink">Upload a recording</h2>
      <p className="mb-3 text-xs text-ink-muted">
        Drag a file in or click to browse. Works with iPhone voice memos and other audio.
        {!sttOn && " (Needs OPENAI_API_KEY to transcribe.)"}
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
          dragging ? "border-primary bg-primary-soft" : "border-line bg-surface-muted hover:border-primary"
        } disabled:pointer-events-none disabled:opacity-60`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-primary">
          <path d="M12 16V4m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        {file ? (
          <span className="text-sm font-medium text-ink">
            {file.name} <span className="text-ink-muted">({fmtSize(file.size)})</span>
          </span>
        ) : (
          <>
            <span className="text-sm font-medium text-ink">Drop your recording here</span>
            <span className="text-xs text-ink-muted">or click to choose a file</span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />

      {err && (
        <p
          className="mt-3 rounded-lg px-3 py-2 text-xs text-danger"
          style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}
        >
          {err}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={submit} disabled={!file || busy} className="btn-primary">
          {stage === "uploading" ? "Uploading…" : stage === "working" ? "Transcribing…" : "Upload & extract"}
        </button>
        {file && !busy && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setErr(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="btn-ghost"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
