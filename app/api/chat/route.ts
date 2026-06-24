/**
 * app/api/chat/route.ts
 *
 * Calls Ollama directly (same format as the original askNarrator)
 * so ChatWindow can parse the NDJSON stream correctly.
 * Python backend is used only for the Safety Auditor (/api/audit).
 */

import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = process.env.LLM_URL        ?? "http://localhost:11434/api/generate";
const MODEL      = process.env.LLM_MODEL      ?? "llama3.2:3b";

const NARRATOR_PROMPT = `You are a Compassionate Context Engine for an elderly care smart-home system.
Your role is to translate raw IoT sensor logs into warm, natural-language summaries
for family members and professional caretakers.

Rules:
- Address the resident as "Mary" unless told otherwise.
- Never list raw timestamps or sensor IDs unless the user explicitly asks.
- Focus on human activities: waking up, hygiene, eating, medication, leisure, rest.
- Be warm and reassuring when everything looks normal.
- Be clear and calm (never alarmist) when something needs attention.
- Always answer the specific question asked — do not ramble.
- Keep answers to 3-6 sentences for simple queries; up to two short paragraphs for complex ones.
- Respond in the same language as the user's question.`;

export async function POST(req: NextRequest) {
  const { question } = await req.json();

  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model:  MODEL,
      prompt: `${NARRATOR_PROMPT}\n\n--- QUESTION ---\n${question}`,
      stream: true,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Ollama error: ${res.status}` }, { status: 502 });
  }

  // Pass Ollama's raw NDJSON stream straight to ChatWindow — no transformation needed
  return new NextResponse(res.body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
