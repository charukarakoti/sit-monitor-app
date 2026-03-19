import axios from "axios";
import db from "./db";
import { sendMail } from "./mailer";

export async function checkSites() {

const sites = db.prepare("SELECT * FROM sites").all();

for (const site of sites) {

let status = "DOWN";
let responseTime = null;
let reason = null;

try {

    const start = Date.now();
    
    /* first try HEAD request */
    
    let res;
    
    try {
    
    res = await axios.head(site.url,{
    timeout:15000,
    maxRedirects:5,
    validateStatus:false,
    headers:{
    "User-Agent":"Mozilla/5.0"
    }
    });
    
    } catch {
    
    res = await axios.get(site.url,{
    timeout:15000,
    maxRedirects:5,
    validateStatus:false,
    headers:{
    "User-Agent":"Mozilla/5.0"
    }
    });
    
    }
    
    responseTime = Date.now() - start;
    
    if(res.status && res.status < 500){
    status = "UP";
    }
    
    } catch (err) {
    
    status = "DOWN";
    reason = err.message;
    
    }

const previousStatus = site.status;

db.prepare(`
UPDATE sites
SET status=?, responseTime=?, reason=?
WHERE id=?
`).run(status, responseTime, reason, site.id);


if(previousStatus !== "DOWN" && status === "DOWN"){

await sendMail(
"🚨 Site Down Alert",
`Site is DOWN: ${site.url}`
);

}

if(previousStatus !== "UP" && status === "UP"){

await sendMail(
"✅ Site Recovered",
`Site is LIVE again: ${site.url}`
);

}

}

}