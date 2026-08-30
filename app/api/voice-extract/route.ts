import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDevMode, MOCK_VOICE_DESCRIPTION } from "@/lib/devMode";

// Falls back to a placeholder key so the client can construct in test mode,
// where it's never actually called.
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "dev-mode-placeholder",
});

export async function POST(request: Request) {
  const { samples } = (await request.json()) as { samples?: string };

  if (!samples?.trim()) {
    return NextResponse.json(
      { error: "Paste something first." },
      { status: 400 }
    );
  }

  if (isDevMode) {
    return NextResponse.json({ voiceDescription: MOCK_VOICE_DESCRIPTION });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let voiceDescription: string;
  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 512,
      system:
        "You analyze a person's writing and draft a short, specific description of their voice for a ghostwriting tool. Read the samples and write one tight paragraph (3-5 sentences) capturing tone, sentence rhythm, quirks, and what they avoid. Address the person directly (\"You write in short punchy lines...\"). Return ONLY the paragraph — no preamble, no headers, no quotes around it.",
      messages: [{ role: "user", content: samples }],
    });
    const textBlock = response.content.find((block) => block.type === "text");
    voiceDescription = textBlock && "text" in textBlock ? textBlock.text.trim() : "";
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach Claude to read that. Try again." },
      { status: 502 }
    );
  }

  if (!voiceDescription) {
    return NextResponse.json(
      { error: "That came back empty. Try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ voiceDescription });
}
