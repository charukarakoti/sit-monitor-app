import db from "@/lib/db";

export async function POST(req){

const {id,domainExpiry,hostingExpiry}=await req.json();

db.prepare(`
UPDATE sites
SET domainExpiry=?,
hostingExpiry=?
WHERE id=?
`).run(domainExpiry,hostingExpiry,id);

return Response.json({success:true});

}