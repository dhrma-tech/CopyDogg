import { NextResponse } from "next/server";
import { checkTone } from "@/lib/claude";
import { isPlatform } from "@/lib/platformRules";
import { isDemoMode, DEMO_TONE_CHECK } from "@/lib/demoMode";
import { readStore } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 8000) : "";

  if (!text) {
    return NextResponse.json({ error: "Paste something to check first." }, { status: 400 });
  }
  if (!isPlatform(body.platform)) {
    return NextResponse.json({ error: "Unknown platform." }, { status: 400 });
  }
  if (isDemoMode) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return NextResponse.json(DEMO_TONE_CHECK);
  }

  const { contacts } = await readStore();
  const contact = contacts.find((c) => c.id === body.contactId) ?? null;

  try {
    const result = await checkTone({ text, platform: body.platform, contact });
    if (!result || !result.verdict) {
      return NextResponse.json({ error: "Couldn't read that one. Try again." }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach Claude. Check your API key and connection, then try again." },
      { status: 502 }
    );
  }
}
