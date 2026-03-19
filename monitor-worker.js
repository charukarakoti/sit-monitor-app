import dotenv from "dotenv";
import cron from "node-cron";
import { checkSites } from "./src/lib/monitor.js";

dotenv.config({ path: ".env.local" });

console.log("Monitoring worker started...");

cron.schedule("*/2 * * * *", async () => {
  console.log("Running scheduled check...");
  await checkSites();
});
