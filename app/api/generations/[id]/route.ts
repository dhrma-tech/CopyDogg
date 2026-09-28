import { NextResponse } from "next/server";
import { updateGeneration, type Generation } from "@/lib/store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const patch: Partial<Pick<Generation, "saved" | "feedback" | "chosenOutput">> = {};
  if (typeof body.saved === "boolean") patch.saved = body.saved;
  if (body.feedback === -1 || body.feedback === 0 || body.feedback === 1)
    patch.feedback = body.feedback;
  if (typeof body.chosen_output === "string") patch.chosenOutput = body.chosen_output;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const found = await updateGeneration(id, patch);
  if (!found) {
    return NextResponse.json({ error: "That post no longer exists." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
