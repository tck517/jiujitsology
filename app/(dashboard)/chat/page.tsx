"use client";

import { ChatPanel } from "@/components/chat/chat-panel";

export default function ChatPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground mt-2">
          Ask questions about your instructional library.
        </p>
      </div>
      <ChatPanel />
    </div>
  );
}
