import db from "@/lib/db";
import { sendMail } from "./mailer";

//CHECK SITE STATUS
async function safeCheck(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return res.ok;

  } catch (err) {
    return false;
  }
}

// FIXED: Expiry check (timezone safe)
function isExpiringSoon(date, days = 7) {
  if (!date) return false;

  const today = new Date();
  const expiry = new Date(date);

  //remove time to avoid timezone bugs
  today.setHours(0,0,0,0);
  expiry.setHours(0,0,0,0);

  const diffDays = (expiry - today) / (1000 * 60 * 60 * 24);

  return diffDays <= days && diffDays >= 0;
}

//MAIN FUNCTION
export async function checkAllSites() {
  try {
    const sites = db.prepare("SELECT * FROM sites").all();

    for (const site of sites) {
      console.log("Checking:", site.url);

      const isUp = await safeCheck(site.url);
      const prevStatus = site.status?.toUpperCase();

      // =========================
      //  DOMAIN EXPIRY ALERT
      // =========================
      if (
        site.domainExpiry &&
        !site.domainAlertSent &&
        isExpiringSoon(site.domainExpiry)
      ) {
        console.log(" Domain expiring soon:", site.url);

        await sendMail(
          ` DOMAIN EXPIRY ALERT\n\n${site.url}\nExpires on: ${site.domainExpiry}`
        );

        db.prepare(`
          UPDATE sites SET domainAlertSent = 1 WHERE id = ?
        `).run(site.id);
      }

      // =========================
      //  HOSTING EXPIRY ALERT
      // =========================
      if (
        site.hostingExpiry &&
        !site.hostingAlertSent &&
        isExpiringSoon(site.hostingExpiry)
      ) {
        console.log(" Hosting expiring soon:", site.url);

        await sendMail(
          ` HOSTING EXPIRY ALERT\n\n${site.url}\nExpires on: ${site.hostingExpiry}`
        );

        db.prepare(`
          UPDATE sites SET hostingAlertSent = 1 WHERE id = ?
        `).run(site.id);
      }

      // =========================
      // SITE STATUS CHECK
      // =========================

      if (isUp) {
        db.prepare(`
          UPDATE sites
          SET status = ?, downSince = NULL
          WHERE id = ?
        `).run("UP", site.id);

        console.log("✅ UP:", site.url);

      } else {
        console.log("❌ DOWN:", site.url);

        // 📧 send mail only first time
        if (prevStatus !== "DOWN") {
          console.log("📧 SITE DOWN ALERT:", site.url);

          await sendMail(
            `🚨 SITE DOWN ALERT\n\n${site.url} is DOWN`
          );
        }

        db.prepare(`
          UPDATE sites
          SET status = ?, downSince = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run("DOWN", site.id);
      }
    }

  } catch (err) {
    console.log("❌ MAIN ERROR:", err.message);
  }
}