import { redirect } from "next/navigation";

export default function ChatLegacyRedirect() {
  redirect("/dashboard/chat");
}
