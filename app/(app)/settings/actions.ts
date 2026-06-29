"use server";

import { createClient } from "@/lib/supabase/server";
import { encryptSecret, encryptionAvailable } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

type Provider = "openai" | "anthropic";
const COL: Record<Provider, "openai_key_cipher" | "anthropic_key_cipher"> = {
  openai: "openai_key_cipher",
  anthropic: "anthropic_key_cipher",
};

async function validate(provider: Provider, key: string): Promise<void> {
  try {
    const res =
      provider === "openai"
        ? await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${key}` } })
        : await fetch("https://api.anthropic.com/v1/models", {
            headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
          });
    if (res.status === 401 || res.status === 403) {
      throw new Error(`${provider === "openai" ? "OpenAI" : "Anthropic"} did not accept that key. Check it and try again.`);
    }
  } catch (e) {
    // Only block on an explicit auth rejection; network hiccups should not stop a valid key.
    if (e instanceof Error && e.message.includes("did not accept")) throw e;
  }
}

export async function setKey(provider: Provider, value: string): Promise<void> {
  const key = (value ?? "").trim();
  if (!key) throw new Error("Paste a key first.");
  if (!encryptionAvailable()) {
    throw new Error("Secure storage is not configured (ENCRYPTION_KEY missing). Ask the admin to set it, then try again.");
  }
  await validate(provider, key);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You are not signed in.");
  const { error } = await supabase
    .from("user_ai_settings")
    .upsert({ user_id: user.id, [COL[provider]]: encryptSecret(key) }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  await logAudit(supabase, {
    action: "update",
    table: "user_ai_settings",
    recordId: user.id,
    summary: `Connected ${provider} key`,
  });
  revalidatePath("/settings");
}

export async function removeKey(provider: Provider): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You are not signed in.");
  const { error } = await supabase.from("user_ai_settings").update({ [COL[provider]]: null }).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, {
    action: "update",
    table: "user_ai_settings",
    recordId: user.id,
    summary: `Removed ${provider} key`,
  });
  revalidatePath("/settings");
}
