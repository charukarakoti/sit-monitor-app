import db from "@/lib/db";
import dns from "dns/promises";

// ✅ IMPORT EMAIL FUNCTION
import { POST as sendEmail } from "@/app/api/send-email/route";


// ✅ Retry function (unchanged)
async function checkSiteWithRetry(url) {
  let success = false;
  let ipAddress = null;

  for (let i = 0; i < 3; i++) {
    try {
      const hostname = new URL(url).hostname;

      const result = await dns.lookup(hostname);
      ipAddress = result.address;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: controller.signal,
        cache: "no-store"
      });

      clearTimeout(timeout);

      if (res.status >= 200 && res.status < 400) {
        success = true;
        break;
      }

    } catch (err) {}

    await new Promise(r => setTimeout(r, 2000));
  }

  return { success, ipAddress };
}


export async function GET() {

  const sites = db.prepare(`
    SELECT id, url, status, lastStatus,
           hostingExpiry, domainExpiry,
           hostingMailSent, domainMailSent,
           downSince
    FROM sites
  `).all();

  const today = new Date();
  today.setHours(0,0,0,0);

  for (const site of sites) {

    const now = Date.now();
    const DOWN_THRESHOLD = 30000; // 30 sec

    let status = "DOWN";
    let ipAddress = null;

    const result = await checkSiteWithRetry(site.url);

    ipAddress = result.ipAddress;

    if (result.success) {
      status = "UP";
    } else {
      console.log("Error:", site.url);
    }

    // 🔴 DOWN EMAIL LOGIC
    if (status === "DOWN") {

      if (!site.downSince) {

        db.prepare(`
          UPDATE sites SET downSince = ?, lastStatus = 'DOWN' WHERE id = ?
        `).run(now, site.id);

      } else {

        const downTime = now - site.downSince;

        if (downTime > DOWN_THRESHOLD && site.lastStatus !== "DOWN_EMAIL_SENT") {

          console.log("DOWN EMAIL:", site.url);

          await sendEmail({
            json: async () => ({
              url: site.url,
              type: "down"
            })
          });

          db.prepare(`
            UPDATE sites SET lastStatus = 'DOWN_EMAIL_SENT' WHERE id = ?
          `).run(site.id);
        }
      }

    } else {

      db.prepare(`
        UPDATE sites SET downSince = NULL, lastStatus = 'UP' WHERE id = ?
      `).run(site.id);
    }

    // 🔴 HOSTING EXPIRY (unchanged)
    if (site.hostingExpiry) {

      const exp = new Date(site.hostingExpiry + "T00:00:00");
      exp.setHours(0,0,0,0);

      const diff = Math.floor((exp - today) / (1000 * 60 * 60 * 24));

      console.log("HOSTING:", site.url, diff, site.hostingMailSent);

      if (diff <= 30 && diff >= 0) {

        if (site.hostingMailSent !== 1) {

          console.log("Sending HOSTING mail:", site.url);

          await sendEmail({
            json: async () => ({
              url: site.url,
              type: "hosting"
            })
          });

          db.prepare(`
            UPDATE sites SET hostingMailSent = 1 WHERE id = ?
          `).run(site.id);
        }

      } else {
        db.prepare(`
          UPDATE sites SET hostingMailSent = 0 WHERE id = ?
        `).run(site.id);
      }
    }

    // 🔴 DOMAIN EXPIRY (unchanged)
    if (site.domainExpiry) {

      const exp = new Date(site.domainExpiry + "T00:00:00");
      exp.setHours(0,0,0,0);

      const diff = Math.floor((exp - today) / (1000 * 60 * 60 * 24));

      console.log("DOMAIN:", site.url, diff, site.domainMailSent);

      if (diff <= 30 && diff >= 0) {

        if (site.domainMailSent !== 1) {

          console.log("Sending DOMAIN mail:", site.url);

          await sendEmail({
            json: async () => ({
              url: site.url,
              type: "domain"
            })
          });

          db.prepare(`
            UPDATE sites SET domainMailSent = 1 WHERE id = ?
          `).run(site.id);
        }

      } else {
        db.prepare(`
          UPDATE sites SET domainMailSent = 0 WHERE id = ?
        `).run(site.id);
      }
    }

    // ✅ FINAL FIX: preserve DOWN_EMAIL_SENT
    let finalLastStatus = site.lastStatus;

    if (status === "UP") {
      finalLastStatus = "UP";
    } else if (status === "DOWN") {
      if (site.lastStatus !== "DOWN_EMAIL_SENT") {
        finalLastStatus = "DOWN";
      }
      // else keep DOWN_EMAIL_SENT
    }

    db.prepare(`
      UPDATE sites
      SET status = ?, lastStatus = ?, ipAddress = ?
      WHERE id = ?
    `).run(status, finalLastStatus, ipAddress, site.id);

  }

  return Response.json({ success:true });
}