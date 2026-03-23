console.log("Monitoring worker started... Will check sites immediately and then every 60 seconds.");

async function ping() {
  console.log("Running scheduled check via API...");
  try {
    const res = await fetch("http://localhost:3000/api/check-sites");
    const data = await res.json();
    console.log("API check complete:", data);
  } catch (err) {
    console.log("API check failed (is Next.js server running?):", err.message);
  }
}

// Run immediately on startup
ping();

// Hook it up to run every 60 seconds
setInterval(ping, 60000);
