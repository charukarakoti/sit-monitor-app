"use client";

import { useEffect, useState } from "react";

export default function StatusPage() {

const [sites, setSites] = useState([]);

async function fetchStatus() {

try {

const res = await fetch("/api/status",{ cache:"no-store" });
const data = await res.json();

setSites(data);

}catch(err){

console.error("Error fetching status:",err);

}

}

useEffect(()=>{

fetchStatus();

const interval = setInterval(fetchStatus,10000);

return ()=> clearInterval(interval);

},[]);

const allUp = sites.length > 0 && sites.every(site => site.status === "up");

return (

<div style={{padding:"40px",fontFamily:"Arial"}}>

<h1>System Status</h1>

<h3 style={{color: allUp ? "green":"red", marginBottom:"30px"}}>

{allUp ? "All Systems Operational":"Some Systems Are Down"}

</h3>

{sites.map((site)=>(

<div
key={site.id}
style={{
border:"1px solid #ddd",
padding:"15px",
marginBottom:"10px",
borderRadius:"6px"
}}
>

<strong>{site.url}</strong>

<div
style={{
color: site.status === "up" ? "green":"red",
fontWeight:"bold",
marginTop:"5px"
}}
>
{site.status === "up" ? "Operational":"Down"}
</div>

{site.ipAddress && (

<div style={{fontSize:"12px",color:"#555"}}>

IP: {site.ipAddress}

</div>

)}

{site.hostingProvider && (

<div style={{fontSize:"12px",color:"#555"}}>

Hosting: {site.hostingProvider}

</div>

)}

{site.reason && (

<div style={{fontSize:"12px",color:"gray"}}>

Reason: {site.reason}

</div>

)}

{site.responseTime && (

<div style={{fontSize:"12px",color:"#555"}}>

Response Time: {site.responseTime} ms

</div>

)}

{site.uptime24h && (

<div style={{fontSize:"12px",color:"#555"}}>

24h Uptime: {site.uptime24h}%

</div>

)}

</div>

))}

</div>

);

}