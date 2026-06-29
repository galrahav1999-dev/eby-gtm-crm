"use server";

import { createClient } from "@/lib/supabase/server";
import { getAllOptions } from "@/lib/options";
import { extractRecords } from "@/lib/ai/extract";
import { transcribeAudio } from "@/lib/ai/transcribe";
import { commitProposal, type IncludeSets } from "@/lib/ai/commit";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function runExtraction(ingestionId: string, transcript: string) {
  const supabase = createClient();
  try {
    const options = await getAllOptions();
    const proposal = await extractRecords(transcript, options);
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
 * Audio is uploaded straight from the browser to Supabase Storage (see
 * AudioUploader), which avoids the Vercel/Next server-action request body limit
 * that blocks multi-megabyte recordings. This action receives only the stored
 * path, then transcribes server-side by downloading the file. Returns the
 * ingestion id so the client can navigate to the review page.
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
