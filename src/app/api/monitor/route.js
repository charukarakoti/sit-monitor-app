import db from "@/lib/db";
import axios from "axios";
import { sendMail } from "@/lib/mailer";
import { checkDomainExpiry } from "@/lib/checkDomainExpiry";
import { checkExpiryAlert } from "@/lib/expiryAlert";
import { getHostingProvider } from "@/lib/getHostingProvider";
import { getIpAddress } from "@/lib/getIpAddress";
import { checkSSLExpiry } from "@/lib/checkSSLExpiry";

export async function GET(){

const sites = db.prepare("SELECT * FROM sites").all();

for(const site of sites){

let status = "DOWN";
let responseTime = null;

const previousStatus = site.status;

try{

const start = Date.now();

const res = await axios.get(site.url,{
timeout:10000,
validateStatus:false
});

responseTime = Date.now() - start;

if(res.status < 500){
status = "UP";
}

}catch(err){

status = "DOWN";

}

/* DOMAIN EXPIRY */

let domainExpiry = site.domainExpiry;

if(!domainExpiry){

const expiry = await checkDomainExpiry(site.url);

if(expiry){
domainExpiry = expiry;
}

}

/* HOSTING PROVIDER */

let hostingProvider = site.hostingProvider;

if(!hostingProvider){

hostingProvider = await getHostingProvider(site.url);

}

/* IP ADDRESS */

let ipAddress = site.ipAddress;

if(!ipAddress){

ipAddress = await getIpAddress(site.url);

}

/* DOMAIN EXPIRY ALERT */

const alertType = checkExpiryAlert(domainExpiry);

if(alertType==="warning"){

await sendMail(
"⚠️ Domain Expiring Soon",
`${site.url} domain expires on ${domainExpiry}`
);

}

if(alertType==="urgent"){

await sendMail(
"🚨 Domain Expiring in 7 Days",
`${site.url} domain expires on ${domainExpiry}`
);

}

/* SSL EXPIRY */

const hostname = new URL(site.url).hostname;

const sslExpiry = await checkSSLExpiry(hostname);

if(sslExpiry){

const sslAlert = checkExpiryAlert(sslExpiry);

if(sslAlert==="warning"){

await sendMail(
"⚠️ SSL Expiring Soon",
`${site.url} SSL expires on ${sslExpiry}`
);

}

if(sslAlert==="urgent"){

await sendMail(
"🚨 SSL Expiring in 7 Days",
`${site.url} SSL expires on ${sslExpiry}`
);

}

}

/* UPDATE DATABASE */

db.prepare(`
UPDATE sites
SET status=?,
responseTime=?,
domainExpiry=?,
hostingProvider=?,
ipAddress=?
WHERE id=?`).run(
status,
responseTime,
domainExpiry,
hostingProvider,
ipAddress,
site.id
);

/* SITE DOWN ALERT */

if(previousStatus!=="DOWN" && status==="DOWN"){

await sendMail(
"🚨 Site Down Alert",
`Site is DOWN: ${site.url}`
);

}

if(previousStatus!=="UP" && status==="UP"){

await sendMail(
"✅ Site Recovered",
`Site is LIVE again: ${site.url}`
);

}

}

return Response.json({success:true});

}
