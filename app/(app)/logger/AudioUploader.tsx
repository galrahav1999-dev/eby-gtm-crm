"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createUploadTarget, parseAudioPaths } from "./actions";

const MAX_FILES = 3;

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isAudio(f: File): boolean {
  return f.type.startsWith("audio/") || /\.(m4a|mp3|wav|aac|ogg|webm|mp4)$/i.test(f.name);
}

/**
 * Capture step of the AI logger funnel: up to 3 audio files (drag-and-drop or
 * browse) and/or pasted text. Files upload directly to Storage via signed URLs
 * (no session or size limit); then the server transcribes, combines, and
 * extracts, and we navigate to the review screen.
 */
export function AudioUploader({ sttOn }: { sttOn: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<"idle" | "uploading" | "working">("idle");
  const [err, setErr] = useState<string | null>(null);

  const busy = stage !== "idle";

  function addFiles(incoming: FileList | null) {
    setErr(null);
    if (!incoming || incoming.length === 0) return;
    const picked = Array.from(incoming);
    const bad = picked.find((f) => !isAudio(f));
    if (bad) {
      setErr(`"${bad.name}" is not an audio file. Use iPhone voice memos or audio recordings.`);
      return;
    }
    setFiles((prev) => {
      const combined = [...prev, ...picked].slice(0, MAX_FILES);
      if (prev.length + picked.length > MAX_FILES) setErr(`You can add up to ${MAX_FILES} files.`);
      return combined;
    });
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (busy) return;
    if (files.length === 0 && !text.trim()) {
      setErr("Add a recording or paste some notes first.");
      return;
    }
    setErr(null);
    setStage("uploading");
    try {
      const supabase = createClient();
      const paths: string[] = [];
      const names: string[] = [];
      for (const file of files) {
        const { path, token } = await createUploadTarget(file.name);
        const { error } = await supabase.storage
          .from("recordings")
          .uploadToSignedUrl(path, token, file, { contentType: file.type || "audio/mpeg" });
        if (error) throw new Error(error.message);
        paths.push(path);
        names.push(file.name);
      }
      setStage("working");
      const { id } = await parseAudioPaths(paths, names, text.trim() || undefined);
      router.push(`/logger/${id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
      setStage("idle");
    }
  }

  const stageLabel =
    stage === "uploading" ? "Uploading…" : stage === "working" ? "Reading the conversation…" : "Extract records";

  return (
    <div className="card p-5">
      <h2 className="mb-1 text-sm font-semibold text-ink">Capture a conversation</h2>
      <p className="mb-3 text-xs text-ink-muted">
        Drop up to {MAX_FILES} recordings, browse for them, or paste notes. You review everything before anything is saved.
        {!sttOn && " (Audio needs OPENAI_API_KEY to transcribe.)"}
      </p>

      <button
        type="button"
        disabled={busy || files.length >= MAX_FILES}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) addFiles(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging ? "border-primary bg-primary-soft" : "border-line bg-surface-muted hover:border-primary"
        } disabled:pointer-events-none disabled:opacity-60`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-primary">
          <path d="M12 16V4m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-medium text-ink">Drop recordings here</span>
        <span className="text-xs text-ink-muted">
          {files.length >= MAX_FILES ? `Maximum ${MAX_FILES} files` : `or click to choose (up to ${MAX_FILES})`}
        </span>
      </button>

      <input ref={inputRef} type="file" accept="audio/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm">
              <span className="min-w-0 truncate text-ink">
                {f.name} <span className="text-ink-muted">({fmtSize(f.size)})</span>
              </span>
              {!busy && (
                <button type="button" onClick={() => removeFile(i)} className="ml-3 shrink-0 text-xs text-ink-muted hover:text-danger">
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-medium text-ink-soft">Or paste notes / a transcript</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Paste the conversation here…"
          className="w-full resize-y rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-primary focus:ring-2 focus:ring-primary"
        />
      </div>

      {err && (
        <p className="mt-3 rounded-lg px-3 py-2 text-xs text-danger" style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}>
          {err}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={submit} disabled={busy} className="btn-primary">
          {stageLabel}
        </button>
        <span className="text-xs text-ink-muted">Nothing is saved yet. You review and accept on the next screen.</span>
      </div>
    </div>
  );
}
