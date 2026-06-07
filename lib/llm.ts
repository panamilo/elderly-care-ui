const LLM_URL = process.env.LLM_URL!;
const LLM_MODEL = process.env.LLM_MODEL ?? "llama3";

const SYSTEM_PROMPT = `You are a caring assistant monitoring an elderly person's health data.
You receive sensor readings and alert history from the last 24 hours.
Answer questions clearly and concisely. If you detect danger, say so directly.
Respond in the same language as the user's question.`;

export async function askNarrator(
  question: string,
  context: string
): Promise<ReadableStream<Uint8Array>> {
  const prompt = `${SYSTEM_PROMPT}\n\n--- SENSOR DATA (last 24h) ---\n${context}\n\n--- QUESTION ---\n${question}`;

  const res = await fetch(LLM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      prompt,
      stream: true,
    }),
  });

  if (!res.ok) throw new Error(`LLM error: ${res.status}`);
  if (!res.body) throw new Error("LLM returned no body");

  return res.body;
}
