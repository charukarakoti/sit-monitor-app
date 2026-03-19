import dns from "dns/promises";

export async function getIpAddress(url){

try{

const hostname = new URL(url).hostname;

const result = await dns.lookup(hostname);

return result.address;

}catch(err){

console.log("IP detect error:",err.message);
return null;

}

}
