"use client";

import { useEffect, useState } from "react";

export default function Home(){

const [sites,setSites]=useState([]);
const [newUrl,setNewUrl]=useState("");
const [lastUpdated,setLastUpdated]=useState("");
const [isClient,setIsClient]=useState(false);
const [editingDates,setEditingDates]=useState({});

// 📡 FETCH
async function fetchSites(){
  const res = await fetch("/api/sites");
  const data = await res.json();
  setSites(data);
}

// CLIENT FLAG
useEffect(()=>{
  setIsClient(true);
},[]);

// LAST UPDATED
useEffect(()=>{
  if(!isClient) return;

  const now = new Date();

  setLastUpdated(
    now.toLocaleString("en-IN",{
      day:"2-digit",
      month:"short",
      year:"numeric",
      hour:"numeric",
      minute:"2-digit",
      second:"2-digit",
      hour12:true
    })
  );

},[sites,isClient]);

// ✅ SINGLE AUTO LOOP (IMPORTANT FIX)
useEffect(()=>{
  fetchSites();

  const interval = setInterval(()=>{
    fetchSites();
  },10000);

  return ()=>clearInterval(interval);
},[]);

// ➕ ADD SITE
async function addSite(){

  if(!newUrl) return;

  const tempSite = {
    id: Date.now(),
    url: newUrl,
    status: "Checking",
    hostingExpiry: null,
    domainExpiry: null,
    ipAddress: null
  };

  setSites(prev => [tempSite, ...prev]);

  await fetch("/api/sites/add",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({url:newUrl})
  });

  setTimeout(fetchSites,2000);

  setNewUrl("");
}

// DELETE
async function deleteSite(url){
  await fetch("/api/sites/delete",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({url})
  });

  fetchSites();
}

// DOMAIN UPDATE
async function updateDomainExpiry(id, date){

  const value = date || null;

  setEditingDates(prev => ({
    ...prev,
    [id]: { ...prev[id], domain: value }
  }));

  setSites(prev =>
    prev.map(s => s.id === id ? { ...s, domainExpiry: value } : s)
  );

  await fetch("/api/sites/update-domain-expiry",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ id, date: value })
  });
}

// HOSTING UPDATE
async function updateHostingExpiry(id, date){

  const value = date || null;

  setEditingDates(prev => ({
    ...prev,
    [id]: { ...prev[id], hosting: value }
  }));

  setSites(prev =>
    prev.map(s => s.id === id ? { ...s, hostingExpiry: value } : s)
  );

  await fetch("/api/sites/update-hosting-expiry",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ id, date: value })
  });
}

// DATE FORMAT
function formatInputDate(date){
  if(!date) return "";
  const d = new Date(date);
  if(isNaN(d)) return "";
  return d.toISOString().split("T")[0];
}

// STATUS COLOR
function getStatusColor(status){
  if(status==="Checking") return "#f59e0b";
  if(status==="UP") return "#16a34a";
  return "#ef4444";
}

// UI
return(

<div style={{
background:"#f5f7fb",
minHeight:"100vh",
padding:"40px",
fontFamily:"Arial",
color:"#111"
}}>

<div style={{maxWidth:"1200px",margin:"auto"}}>

<h1 style={{fontSize:"30px",fontWeight:"700"}}>
🌐 Site Monitor Dashboard
</h1>

<p style={{color:"#555"}}>
Last updated: {isClient ? lastUpdated : ""}
</p>

<div style={{margin:"25px 0"}}>

<input
type="text"
placeholder="Enter site URL (https://example.com)"
value={newUrl}
onChange={(e)=>setNewUrl(e.target.value)}
style={{
padding:"12px",
width:"350px",
borderRadius:"8px",
border:"1px solid #ccc"
}}
/>

<button
onClick={addSite}
style={{
padding:"12px 18px",
background:"#2563eb",
color:"#fff",
border:"none",
borderRadius:"8px",
marginLeft:"10px"
}}
>
Add Site
</button>

</div>

<div style={{
background:"#fff",
borderRadius:"10px",
overflow:"hidden",
boxShadow:"0 2px 10px rgba(0,0,0,0.05)"
}}>

<div style={{
display:"flex",
padding:"15px",
background:"#f1f5f9",
fontWeight:"600"
}}>

<div style={{width:"35%"}}>Site</div>
<div style={{width:"10%"}}>Status</div>
<div style={{width:"15%"}}>Hosting Expiry</div>
<div style={{width:"15%"}}>IP</div>
<div style={{width:"15%"}}>Domain Expiry</div>
<div style={{width:"10%"}}>Action</div>

</div>

{sites.map(site=>(

<div key={site.id} style={{
display:"flex",
padding:"15px",
borderBottom:"1px solid #eee",
alignItems:"center"
}}>

<div style={{width:"35%"}}>
<strong>{site.url}</strong>
</div>

<div style={{width:"10%"}}>
<span style={{color:getStatusColor(site.status)}}>
{site.status === "Checking"
  ? "Checking..."
  : site.status === "UP"
  ? "LIVE"
  : "DOWN"}
</span>
</div>

{/* HOSTING */}
<div style={{width:"15%"}}>
<input
type="date"
value={
  editingDates[site.id]?.hosting ||
  formatInputDate(site.hostingExpiry)
}
onChange={(e)=>updateHostingExpiry(site.id, e.target.value)}
/>

{site.hostingExpiry && (() => {
  const today = new Date();
  const exp = new Date(site.hostingExpiry + "T00:00:00");
  today.setHours(0,0,0,0);
  exp.setHours(0,0,0,0);
  const diff = Math.floor((exp - today) / (1000*60*60*24));
  return diff >= 0 && diff <= 30;
})() && (
  <div style={{color:"orange",fontSize:"11px"}}>
    Hosting Expiring Soon ⚠️
  </div>
)}
</div>

<div style={{width:"15%"}}>
{site.ipAddress || "--"}
</div>

{/* DOMAIN */}
<div style={{width:"15%"}}>
<input
type="date"
value={
  editingDates[site.id]?.domain ||
  formatInputDate(site.domainExpiry)
}
onChange={(e)=>updateDomainExpiry(site.id, e.target.value)}
/>

{site.domainExpiry && (() => {
  const today = new Date();
  const exp = new Date(site.domainExpiry + "T00:00:00");
  today.setHours(0,0,0,0);
  exp.setHours(0,0,0,0);
  const diff = Math.floor((exp - today) / (1000*60*60*24));
  return diff >= 0 && diff <= 30;
})() && (
  <div style={{color:"orange",fontSize:"11px"}}>
    Domain Expiring Soon ⚠️
  </div>
)}
</div>

<div style={{width:"10%", display:"flex", gap:"6px"}}>

  {/* VISIT BUTTON */}
  <a
    href={site.url}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      padding:"6px 10px",
      background:"#16a34a",
      color:"#fff",
      borderRadius:"6px",
      textDecoration:"none",
      fontSize:"12px"
    }}
  >
    Visit
  </a>

  {/* DELETE BUTTON (unchanged functionality) */}
  <button 
    onClick={()=>deleteSite(site.url)}
    style={{
      padding:"6px 10px",
      background:"#ef4444",
      color:"#fff",
      border:"none",
      borderRadius:"6px",
      fontSize:"12px"
    }}
  >
    Delete
  </button>

</div>

</div>

))}

</div>

</div>

</div>

);

}