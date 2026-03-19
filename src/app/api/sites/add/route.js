import db from "@/lib/db";

export async function POST(req) {
  const { url } = await req.json();

  db.prepare(`
    INSERT INTO sites (url, status)
    VALUES (?, ?)
  `).run(url, "Checking");

  return Response.json({ success: true });
}