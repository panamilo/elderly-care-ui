"use client";

import { useState, useRef, useEffect } from "react";
import { getSocket, type ChatMessage } from "@/lib/socket";

interface Message {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

// We tag our outgoing messages so we can tell our own echo (the connector
// broadcasts every chat message back to all clients) apart from AI replies.
const ME = "caretaker";

const QUICK_PROMPTS = [
  "Did she have a good breakfast today?",
  "Did she take her medication?",
  "How was the night?",
  "Did she go out today?",
];

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // A reply is pending whenever there is an unanswered assistant placeholder.
  const waiting = messages.some((m) => m.role === "assistant" && m.pending);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onChat = (msg: ChatMessage) => {
      // Only the narrator's replies become assistant bubbles. The server's
      // welcome message and the echo of our own message are ignored.
      if (msg.user !== "ai") return;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.role === "assistant" && m.pending);
        const filled: Message = { role: "assistant", content: msg.text };
        if (idx === -1) return [...prev, filled];
        const next = [...prev];
        next[idx] = filled;
        return next;
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("chat", onChat);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat", onChat);
    };
  }, []);

  function sendMessage(text?: string) {
    const question = (text ?? input).trim();
    if (!question || waiting) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "", pending: true },
    ]);
    setInput("");

    getSocket().emit("chat", { user: ME, text: question });
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
                Ask about the last 24 hours of sensor data. The Narrator analyzes the data and provides human-friendly summaries.
              </p>
            </div>
            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  disabled={!connected || waiting}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors font-medium disabled:opacity-50"
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
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm"
              }`}
            >
              {m.content ||
                (m.role === "assistant" && m.pending ? (
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
        {!connected && (
          <p className="max-w-3xl mx-auto mb-2 text-[11px] text-amber-600 font-medium">
            Connecting to the Narrator… Make sure the connector is running.
          </p>
        )}
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            className="flex-1 px-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 transition-shadow"
            placeholder="e.g. Did she have a restful night?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={!connected || waiting}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!connected || waiting || !input.trim()}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
