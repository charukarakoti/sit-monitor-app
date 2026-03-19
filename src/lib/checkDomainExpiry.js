import whois from "whois-json";

export async function checkDomainExpiry(url){

try{

let domain = new URL(url).hostname;

domain = domain.replace("www.","");
const data = await whois(domain);

const expiry =
data.expirationDate ||
data.registryExpiryDate ||
data.expiryDate ||
data.registrarRegistrationExpirationDate ||
null;

return expiry;

}catch(err){

console.log("WHOIS error:",err.message);
return null;

}

}
