import db from "@/lib/db";

export async function POST(req) {
  const { url } = await req.json();

  if (!url) {
    return Response.json({ error: "URL required" }, { status: 400 });
  }

  db.prepare("DELETE FROM sites WHERE url = ?").run(url);

  return Response.json({ success: true });
}