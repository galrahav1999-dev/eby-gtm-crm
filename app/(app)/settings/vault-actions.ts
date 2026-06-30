"use server";

import { createClient } from "@/lib/supabase/server";
import { encryptSecret, encryptionAvailable } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

type Provider = "openai" | "anthropic";

/**
 * Require an elevated (aal2) session to manage keys when the user has 2FA set up.
 * If they have a factor but the session is not aal2, block until they verify a
 * code (the client prompts for it). Users without 2FA are not blocked here; the
 * first-login 2FA requirement is a separate slice.
 */
async function requireElevated(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.nextLevel === "aal2" && data?.currentLevel !== "aal2") {
    throw new Error("Verify your 6-digit code to manage keys.");
  }
}

export async function addKey(provider: Provider, label: string, value: string): Promise<void> {
  const key = (value ?? "").trim();
  if (!key) throw new Error("Paste a key first.");
  if (!encryptionAvailable()) throw new Error("Secure storage is not configured (ENCRYPTION_KEY missing). Ask the admin.");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You are not signed in.");
  await requireElevated(supabase);

  // First key for a provider becomes active automatically.
  const { count } = await supabase
    .from("user_api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("provider", provider);
  const makeActive = (count ?? 0) === 0;

  const { error } = await supabase.from("user_api_keys").insert({
    user_id: user.id,
    provider,
    label: (label ?? "").trim() || null,
    key_cipher: encryptSecret(key),
    is_active: makeActive,
  });
  if (error) throw new Error(error.message);
  await logAudit(supabase, { action: "create", table: "user_api_keys", recordId: user.id, summary: `Added ${provider} key` });
  revalidatePath("/settings");
}

export async function activateKey(id: number, provider: Provider): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You are not signed in.");
  await requireElevated(supabase);
  // Deactivate others first (the partial unique index allows only one active).
  await supabase.from("user_api_keys").update({ is_active: false }).eq("user_id", user.id).eq("provider", provider);
  const { error } = await supabase.from("user_api_keys").update({ is_active: true }).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, { action: "update", table: "user_api_keys", recordId: user.id, summary: `Activated a ${provider} key` });
  revalidatePath("/settings");
}

export async function removeKey(id: number): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You are not signed in.");
  await requireElevated(supabase);
  const { error } = await supabase.from("user_api_keys").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, { action: "delete", table: "user_api_keys", recordId: user.id, summary: "Removed an API key" });
  revalidatePath("/settings");
}
