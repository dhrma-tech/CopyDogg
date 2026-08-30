import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDevMode } from "@/lib/devMode";

interface PatchBody {
  saved?: boolean;
  feedback?: -1 | 0 | 1;
  chosen_output?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isDevMode) {
    return NextResponse.json({ ok: true });
  }

  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json()) as PatchBody;

  const update: PatchBody = {};
  if (typeof body.saved === "boolean") update.saved = body.saved;
  if (body.feedback === -1 || body.feedback === 0 || body.feedback === 1)
    update.feedback = body.feedback;
  if (typeof body.chosen_output === "string")
    update.chosen_output = body.chosen_output;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabase
    .from("generations")
    .update(update)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Couldn't save that. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
