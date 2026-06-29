import "server-only";

/**
 * Speech-to-text for a call recording. Uses OpenAI Whisper by default (handles
 * Hebrew + English). Provider is swappable later; gated by OPENAI_API_KEY so the
 * rest of the app works without it.
 */
export async function transcribeAudio(file: Blob, filename: string, apiKey?: string | null): Promise<string> {
  const key = apiKey ?? process.env.OPENAI_API_KEY;
  if (!key) throw new Error("No transcription key. Connect your OpenAI key in Settings to enable audio.");
  const model = process.env.STT_MODEL || "whisper-1";

  const form = new FormData();
  form.append("file", file, filename);
  form.append("model", model);

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Transcription failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { text: string };
  return data.text;
}
