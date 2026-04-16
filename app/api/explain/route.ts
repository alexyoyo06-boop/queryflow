import Groq from "groq-sdk";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const { sql } = await req.json();

  if (!sql || typeof sql !== "string") {
    return new Response(JSON.stringify({ error: "No SQL provided" }), { status: 400 });
  }

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are a SQL expert that explains queries clearly and concisely.
When given a SQL query, explain:
1. What the query does in plain language (1-2 sentences)
2. Each major clause (FROM, JOIN, WHERE, GROUP BY, etc.) and what it does
3. What the final result will look like

Be concise, use simple language, and format with short paragraphs. Do not use markdown headers. Keep the explanation under 150 words.`,
      },
      {
        role: "user",
        content: `Explain this SQL query:\n\n${sql}`,
      },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
