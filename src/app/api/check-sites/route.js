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

    let finalLastStatus = site.lastStatus;
    let finalDownSince = site.downSince;

    // 🔴 DOWN / UP EMAIL LOGIC
    if (status === "DOWN") {
      if (!finalDownSince) finalDownSince = now;
      
      if (finalLastStatus !== "DOWN_EMAIL_SENT") {
        console.log("DOWN EMAIL:", site.url);
        await sendEmail({
          json: async () => ({
            url: site.url,
            type: "down"
          })
        });
        finalLastStatus = 'DOWN_EMAIL_SENT';
      }
    } else {
      if (finalLastStatus === 'DOWN_EMAIL_SENT') {
        console.log("UP EMAIL:", site.url);
        await sendEmail({
          json: async () => ({
            url: site.url,
            type: "up"
          })
        });
      }
      finalDownSince = null;
      finalLastStatus = 'UP';
    }

    // 🔴 HOSTING EXPIRY (unchanged)
    if (site.hostingExpiry) {

      const exp = new Date(site.hostingExpiry + "T00:00:00");
      exp.setHours(0,0,0,0);

      const diff = Math.floor((exp - today) / (1000 * 60 * 60 * 24));

      console.log("HOSTING:", site.url, diff);

      if (diff <= 30 && diff >= 0) {
        const oneDayMs = 24 * 60 * 60 * 1000;
        const lastSent = site.hostingMailSent;
        
        let shouldSend = false;
        if (!lastSent || lastSent === 0 || lastSent === 1) {
          shouldSend = true;
        } else if (now - lastSent > oneDayMs) {
          shouldSend = true;
        }

        if (shouldSend) {
          console.log("Sending HOSTING mail:", site.url);
          await sendEmail({
            json: async () => ({
              url: site.url,
              type: "hosting"
            })
          });

          db.prepare(`
            UPDATE sites SET hostingMailSent = ? WHERE id = ?
          `).run(now, site.id);
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

      console.log("DOMAIN:", site.url, diff);

      if (diff <= 30 && diff >= 0) {
        const oneDayMs = 24 * 60 * 60 * 1000;
        const lastSent = site.domainMailSent;
        
        let shouldSend = false;
        if (!lastSent || lastSent === 0 || lastSent === 1) {
          shouldSend = true;
        } else if (now - lastSent > oneDayMs) {
          shouldSend = true;
        }

        if (shouldSend) {
          console.log("Sending DOMAIN mail:", site.url);
          await sendEmail({
            json: async () => ({
              url: site.url,
              type: "domain"
            })
          });

          db.prepare(`
            UPDATE sites SET domainMailSent = ? WHERE id = ?
          `).run(now, site.id);
        }
      } else {
        db.prepare(`
          UPDATE sites SET domainMailSent = 0 WHERE id = ?
        `).run(site.id);
      }
    }

    db.prepare(`
      UPDATE sites
      SET status = ?, lastStatus = ?, downSince = ?, ipAddress = ?
      WHERE id = ?
    `).run(status, finalLastStatus, finalDownSince, ipAddress, site.id);

  }

  return Response.json({ success:true });
}