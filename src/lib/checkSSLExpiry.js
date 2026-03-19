import tls from "tls";

export function checkSSLExpiry(domain){

return new Promise((resolve,reject)=>{

const socket = tls.connect(443,domain,{servername:domain},()=>{

const cert = socket.getPeerCertificate();

if(cert && cert.valid_to){

resolve(cert.valid_to);

}else{

resolve(null);

}

socket.end();

});

socket.on("error",(err)=>{
resolve(null);
});

});

}
