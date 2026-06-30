import { encryptionAvailable } from "@/lib/crypto";
import { PageHeader } from "@/components/crm/ui";
import { TwoFactor } from "./TwoFactor";
import { KeyVault } from "./KeyVault";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const encOn = encryptionAvailable();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        subtitle="Manage two-factor authentication and your AI keys. Keys are encrypted at rest and never shown again. Your key only pays for the provider call; the parsing is ours and the same for everyone."
      />

      {!encOn && (
        <div className="rounded-lg px-3 py-2 text-sm text-danger" style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}>
          Secure storage is not configured yet. The admin needs to set <span className="font-mono">ENCRYPTION_KEY</span> in the
          hosting environment before keys can be connected.
        </div>
      )}

      <div className="rounded-lg px-3 py-2 text-sm text-ink-soft" style={{ background: "color-mix(in srgb, var(--primary) 9%, transparent)" }}>
        You can run the whole logger on Claude alone when you paste notes or a transcript. An OpenAI key is needed only to
        transcribe uploaded audio (Whisper is OpenAI's speech-to-text). Keep several keys and switch which is active.
      </div>

      <TwoFactor />
      <KeyVault encOn={encOn} />
    </div>
  );
}
