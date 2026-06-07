"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Είχε καλό πρωινό σήμερα;",
  "Πήρε τα φάρμακά της;",
  "Πώς ήταν η νύχτα;",
  "Βγήκε έξω σήμερα;",
];

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export default function ChatWindow({ deviceId }: { deviceId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    const userMsg: Message = { role: "user", content: question };
    const assistantMsg: Message = { role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    const assistantIdx = messages.length + 1;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, deviceId }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const token: string = JSON.parse(line).response ?? "";
            setMessages((prev) => {
              const updated = [...prev];
              updated[assistantIdx] = {
                ...updated[assistantIdx],
                content: updated[assistantIdx].content + token,
              };
              return updated;
            });
          } catch {
            // non-JSON line
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIdx] = {
          role: "assistant",
          content: "Σφάλμα σύνδεσης με τον Narrator. Βεβαιωθείτε ότι το LLM endpoint είναι διαθέσιμο.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 lg:px-7 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-6 py-12">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">
                Narrator — Compassionate Context Engine
              </p>
              <p className="text-xs text-slate-400 max-w-xs">
                Ρωτήστε για τα δεδομένα αισθητήρων των τελευταίων 24 ωρών. Ο Narrator αναλύει τα δεδομένα και παρέχει ανθρώπινες περιλήψεις.
              </p>
            </div>
            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors font-medium"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5 mr-2">
                AI
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm"
              }`}
            >
              {m.content ||
                (loading && m.role === "assistant" ? (
                  <span className="flex gap-1 items-center py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                ) : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-4 lg:px-6 py-4">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            className="flex-1 px-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 transition-shadow"
            placeholder="π.χ. Είχε ξεκουραστική νύχτα;"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            aria-label="Αποστολή"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
