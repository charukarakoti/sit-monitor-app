import dns from "dns/promises";

export async function getHostingProvider(url){

try{

const hostname = new URL(url).hostname;

const ns = await dns.resolveNs(hostname);

const nsString = ns.join(" ").toLowerCase();

if(nsString.includes("cloudflare")) return "Cloudflare";
if(nsString.includes("awsdns")) return "AWS";
if(nsString.includes("digitalocean")) return "DigitalOcean";
if(nsString.includes("godaddy")) return "GoDaddy";
if(nsString.includes("bluehost")) return "Bluehost";
if(nsString.includes("hostinger")) return "Hostinger";

return "Unknown";

}catch(err){

console.log("Hosting detect error:",err.message);
return null;

}

}
