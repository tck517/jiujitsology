"use client";

import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {content}
      </div>
    </div>
  );
}
