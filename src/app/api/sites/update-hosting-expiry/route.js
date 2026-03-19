import db from "@/lib/db";

export async function POST(req) {

  const { id, date } = await req.json();

  db.prepare(`
    UPDATE sites
    SET hostingExpiry = ?
    WHERE id = ?
  `).run(date || null, id);

  return Response.json({ success:true });
}