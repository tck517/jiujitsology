import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createServerClient } from "@/lib/supabase/server";
import { buildChatContext, buildSystemPrompt } from "@/lib/chat-context";

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await request.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response("Missing messages", { status: 400 });
  }

  // Get the latest user message for context retrieval
  const lastUserMessage = messages
    .filter((m: { role: string }) => m.role === "user")
    .pop();

  // Build context from knowledge graph + embeddings
  const context = await buildChatContext(
    supabase,
    user.id,
    lastUserMessage?.content || ""
  );

  const systemPrompt = buildSystemPrompt(context);

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
