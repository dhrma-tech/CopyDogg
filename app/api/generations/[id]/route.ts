import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json()) as { saved?: boolean };

  if (typeof body.saved !== "boolean") {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabase
    .from("generations")
    .update({ saved: body.saved })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Couldn't save that. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
