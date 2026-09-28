import { readStore } from "@/lib/store";

/** Downloads everything CopyDogg has stored, as one JSON file. */
export async function GET() {
  const data = await readStore();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="copydogg-export-${date}.json"`,
    },
  });
}
