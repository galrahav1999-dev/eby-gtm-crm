import { createClient } from "@/lib/supabase/server";
import { encryptionAvailable } from "@/lib/crypto";
import { PageHeader } from "@/components/crm/ui";
import { KeyCard } from "./KeyCard";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = user
    ? await supabase.from("user_ai_settings").select("openai_key_cipher, anthropic_key_cipher").eq("user_id", user.id).maybeSingle()
    : { data: null as any };
  const encOn = encryptionAvailable();

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Connect your own AI keys for the logger. Keys are encrypted at rest and never shown again. Your key only pays for the provider call; the parsing is ours and the same for everyone."
      />

      {!encOn && (
        <div
          className="mb-4 rounded-lg px-3 py-2 text-sm text-danger"
          style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}
        >
          Secure storage is not configured yet. The admin needs to set <span className="font-mono">ENCRYPTION_KEY</span> in
          the hosting environment before keys can be connected.
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <KeyCard
          provider="openai"
          label="Transcription (OpenAI)"
          blurb="Turns uploaded recordings into text (Whisper)."
          getUrl="https://platform.openai.com/api-keys"
          connected={!!(data as any)?.openai_key_cipher}
          disabled={!encOn}
        />
        <KeyCard
          provider="anthropic"
          label="Extraction (Anthropic)"
          blurb="Reads the transcript and drafts records (Claude)."
          getUrl="https://console.anthropic.com/settings/keys"
          connected={!!(data as any)?.anthropic_key_cipher}
          disabled={!encOn}
        />
      </div>
    </div>
  );
}
