import db from "@/lib/db";

export async function GET() {
  const sites = db.prepare(`
    SELECT 
      id,
      url,
      status,
      ipAddress,
      hostingExpiry,
      domainExpiry
    FROM sites
    ORDER BY id DESC
  `).all();

  return Response.json(sites);
}