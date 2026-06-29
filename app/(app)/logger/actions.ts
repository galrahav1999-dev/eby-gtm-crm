"use server";

import { createClient } from "@/lib/supabase/server";
import { getAllOptions } from "@/lib/options";
import { extractRecords } from "@/lib/ai/extract";
import { transcribeAudio } from "@/lib/ai/transcribe";
import { resolveKey } from "@/lib/ai/keys";
import { commitProposal, type IncludeSets } from "@/lib/ai/commit";
import type { Proposal } from "@/lib/ai/extract";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function runExtraction(ingestionId: string, transcript: string) {
  const supabase = createClient();
  try {
    const options = await getAllOptions();
    const anthropicKey = await resolveKey("anthropic");
    const proposal = await extractRecords(transcript, options, anthropicKey);
    await supabase.from("ai_ingestions").update({ proposal, status: "proposed" }).eq("id", ingestionId);
  } catch (e) {
    await supabase
      .from("ai_ingestions")
      .update({ status: "error", error: e instanceof Error ? e.message : String(e) })
      .eq("id", ingestionId);
  }
}

export async function parseText(fd: FormData) {
  const transcript = String(fd.get("transcript") ?? "").trim();
  if (!transcript) throw new Error("Paste some notes or a transcript first.");
  const supabase = createClient();
  const { data: ing, error } = await supabase
    .from("ai_ingestions")
    .insert({ source_type: "text", transcript, status: "extracting" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await runExtraction(ing.id, transcript);
  revalidatePath("/logger");
  redirect(`/logger/${ing.id}`);
}

/**
 * Issue a one-time signed upload URL so the browser can upload the recording
 * directly to Storage. This bypasses both the Vercel/Next server-action request
 * body limit (which blocked multi-megabyte recordings) and storage RLS (the
 * signed token is pre-authorized, so the browser does not need a session).
 */
export async function createUploadTarget(filename: string): Promise<{ path: string; token: string }> {
  const supabase = createClient();
  const safe = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const { data, error } = await supabase.storage.from("recordings").createSignedUploadUrl(safe);
  if (error || !data) throw new Error(error?.message || "Could not start the upload.");
  return { path: data.path, token: data.token };
}

/**
 * After the browser uploads the file, this action transcribes it server-side by
 * downloading from Storage, then extracts records. Returns the ingestion id so
 * the client can navigate to the review page.
 */
export async function parseAudioPath(path: string, filename: string): Promise<{ id: string }> {
  const supabase = createClient();
  const { data: ing, error } = await supabase
    .from("ai_ingestions")
    .insert({ source_type: "audio", audio_path: path, audio_filename: filename, status: "transcribing" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  try {
    const { data: blob, error: dlErr } = await supabase.storage.from("recordings").download(path);
    if (dlErr || !blob) throw new Error(dlErr?.message || "Could not read the uploaded recording.");
    const transcript = await transcribeAudio(blob, filename);
    await supabase.from("ai_ingestions").update({ transcript, status: "transcribed" }).eq("id", ing.id);
    await runExtraction(ing.id, transcript);
  } catch (e) {
    await supabase
      .from("ai_ingestions")
      .update({ status: "error", error: e instanceof Error ? e.message : String(e) })
      .eq("id", ing.id);
  }
  revalidatePath("/logger");
  return { id: ing.id };
}

/**
 * Transcribe up to 3 uploaded files (already in Storage) plus optional pasted
 * text, combine into one transcript, and extract once. Returns the ingestion id.
 */
export async function parseAudioPaths(
  paths: string[],
  filenames: string[],
  pastedText?: string
): Promise<{ id: string }> {
  const supabase = createClient();
  const { data: ing, error } = await supabase
    .from("ai_ingestions")
    .insert({
      source_type: paths.length ? "audio" : "text",
      audio_path: paths.join(",") || null,
      audio_filename: filenames.join(", ") || null,
      status: "transcribing",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  try {
    const sttKey = paths.length ? await resolveKey("openai") : null;
    const parts: string[] = [];
    for (let i = 0; i < paths.length; i++) {
      const { data: blob, error: dlErr } = await supabase.storage.from("recordings").download(paths[i]);
      if (dlErr || !blob) throw new Error(dlErr?.message || "Could not read an uploaded recording.");
      const t = await transcribeAudio(blob, filenames[i] || `audio-${i + 1}`, sttKey);
      parts.push(paths.length > 1 ? `# Recording ${i + 1}: ${filenames[i] ?? ""}\n${t}` : t);
    }
    const pasted = (pastedText ?? "").trim();
    if (pasted) parts.push(paths.length ? `# Pasted notes\n${pasted}` : pasted);
    const transcript = parts.join("\n\n");
    if (!transcript.trim()) throw new Error("Nothing to read: no audio transcribed and no text pasted.");
    await supabase.from("ai_ingestions").update({ transcript, status: "transcribed" }).eq("id", ing.id);
    await runExtraction(ing.id, transcript);
  } catch (e) {
    await supabase
      .from("ai_ingestions")
      .update({ status: "error", error: e instanceof Error ? e.message : String(e) })
      .eq("id", ing.id);
  }
  revalidatePath("/logger");
  return { id: ing.id };
}

/**
 * Commit the operator's edited proposal (from the review screen). Same dedupe,
 * linking, and audit as the raw commit, but uses the values the human accepted,
 * and stores the edited proposal back on the ingestion.
 */
export async function commitEdited(
  id: string,
  edited: Proposal,
  includeArr: { organizations: number[]; people: number[]; deals: number[]; interactions: number[] }
): Promise<{ ok: true }> {
  const supabase = createClient();
  const include: IncludeSets = {
    organizations: new Set(includeArr.organizations),
    people: new Set(includeArr.people),
    interactions: new Set(includeArr.interactions),
    deals: new Set(includeArr.deals),
  };
  const result = await commitProposal(supabase, edited, include);
  await supabase.from("ai_ingestions").update({ status: "committed", result, proposal: edited }).eq("id", id);
  await logAudit(supabase, {
    action: "create",
    table: "ai_ingestions",
    recordId: id,
    summary: `AI logger committed ${result.organizations.length} orgs, ${result.people.length} people, ${result.deals.length} deals, ${result.interactions.length} interactions`,
  });
  revalidatePath("/");
  revalidatePath("/people");
  revalidatePath("/organizations");
  revalidatePath("/deals");
  revalidatePath("/interactions");
  return { ok: true };
}

function includeSet(fd: FormData, prefix: string): Set<number> {
  const s = new Set<number>();
  for (const key of fd.keys()) {
    if (key.startsWith(prefix + "_")) {
      const n = Number(key.slice(prefix.length + 1));
      if (!isNaN(n)) s.add(n);
    }
  }
  return s;
}

export async function commitIngestion(id: string, fd: FormData) {
  const supabase = createClient();
  const { data: ing } = await supabase.from("ai_ingestions").select("proposal, status").eq("id", id).single();
  if (!ing?.proposal) throw new Error("Nothing to save.");

  const include: IncludeSets = {
    organizations: includeSet(fd, "org"),
    people: includeSet(fd, "person"),
    interactions: includeSet(fd, "interaction"),
    deals: includeSet(fd, "deal"),
  };

  const result = await commitProposal(supabase, ing.proposal, include);
  await supabase.from("ai_ingestions").update({ status: "committed", result }).eq("id", id);
  await logAudit(supabase, {
    action: "create",
    table: "ai_ingestions",
    recordId: id,
    summary: `AI logger committed ${result.organizations.length} orgs, ${result.people.length} people, ${result.deals.length} deals, ${result.interactions.length} interactions`,
  });

  revalidatePath("/");
  revalidatePath("/people");
  revalidatePath("/organizations");
  redirect(`/logger/${id}`);
}

export async function discardIngestion(id: string) {
  const supabase = createClient();
  await supabase.from("ai_ingestions").update({ status: "discarded" }).eq("id", id);
  revalidatePath("/logger");
  redirect("/logger");
}
