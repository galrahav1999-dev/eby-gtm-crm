import "server-only";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";

export type Provider = "openai" | "anthropic";

const COL: Record<Provider, "openai_key_cipher" | "anthropic_key_cipher"> = {
  openai: "openai_key_cipher",
  anthropic: "anthropic_key_cipher",
};

/**
 * Resolve the API key to use for a provider for the current request: the
 * signed-in user's connected key first, then the optional server env key as an
 * admin fallback, else null. The user's key only pays for the provider call;
 * our prompt, schema, and parsing are unchanged (see docs/EBY-PRD-AI-KEYS.md).
 */
export async function resolveKey(provider: Provider): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const col = COL[provider];
    const { data } = await supabase.from("user_ai_settings").select(col).eq("user_id", user.id).maybeSingle();
    const cipher = (data as any)?.[col] as string | undefined;
    if (cipher) {
      try {
        return decryptSecret(cipher);
      } catch {
        /* fall through to env fallback */
      }
    }
  }
  return provider === "openai" ? process.env.OPENAI_API_KEY ?? null : process.env.ANTHROPIC_API_KEY ?? null;
}

/** Whether the current user (or env fallback) has a usable key for a provider. */
export async function hasKey(provider: Provider): Promise<boolean> {
  return (await resolveKey(provider)) != null;
}
