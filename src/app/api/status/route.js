import db from "@/lib/db";
import dns from "dns/promises";

export async function GET() {

  const sites = db.prepare(`
    SELECT id, url, status, responseTime, reason, downSince,
    ipAddress, hostingProvider, domainExpiry
    FROM sites
    ORDER BY id ASC
  `).all();

  for (let site of sites) {

    let status = "down";
    let responseTime = 0;
    let reason = null;
    let ipAddress = null;

    try {

      const start = Date.now();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(site.url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      clearTimeout(timeout);

      responseTime = Date.now() - start;

      if (res.status >= 200 && res.status < 500) {
        status = "up";
      } else {
        reason = "Server error";
      }

      const domain = new URL(site.url).hostname;
      const ip = await dns.lookup(domain);
      ipAddress = ip.address;

    } catch (err) {
      reason = "Connection failed";
    }

    db.prepare(`
      UPDATE sites
      SET status = ?, responseTime = ?, reason = ?, ipAddress = ?
      WHERE id = ?
    `).run(status, responseTime, reason, ipAddress, site.id);

    site.status = status;
    site.responseTime = responseTime;
    site.reason = reason;
    site.ipAddress = ipAddress;

  }

  return Response.json(sites);
}