import ChatWindow from "@/components/ChatWindow";

const DEVICE_ID = process.env.NEXT_PUBLIC_DEVICE_ID ?? "DEMO";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-5 lg:px-7 py-5 border-b border-slate-200 bg-white shrink-0">
        <h1 className="text-lg font-bold text-slate-900 leading-tight">AI Βοηθός</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Narrator — ανάλυση δεδομένων 24ώρου σε φυσική γλώσσα
        </p>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow deviceId={DEVICE_ID} />
      </div>
    </div>
  );
}
