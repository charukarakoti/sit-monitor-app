import nodemailer from "nodemailer";

export async function POST(req){

  try {
    const { url, type } = await req.json();

    console.log("EMAIL TRIGGER:", type, url);

    // ✅ BETTER CONFIG (GMAIL SAFE)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    let subject = "";
    let text = "";

    if(type === "down"){
      subject = "🚨 Site Down Alert";
      text = `${url} is DOWN. Please check immediately.`;
    }

    if(type === "up"){
      subject = "✅ Site Back UP Alert";
      text = `${url} is back UP and running normally.`;
    }

    if(type === "hosting"){
      subject = "⚠️ Hosting Expiring Soon";
      text = `Hosting for ${url} will expire within 30 days. Please renew.`;
    }

    if(type === "domain"){
      subject = "⚠️ Domain Expiring Soon";
      text = `Domain for ${url} will expire within 30 days. Please renew.`;
    }

    // ❗ safety check
    if(!subject){
      console.log("❌ INVALID EMAIL TYPE:", type);
      return Response.json({ success:false });
    }

    const info = await transporter.sendMail({
      from: `"Site Monitor" <${process.env.EMAIL_USER}>`,
      to: [
        process.env.EMAIL_USER,
        "manish0214@gmail.com",
        " team@jaiveeru.co.in"
      ],      subject,
      text
    });

    console.log("✅ EMAIL SENT:", info.messageId);

    return Response.json({ success:true });

  } catch (error) {
    console.log("❌ EMAIL ERROR:", error.message);
    return Response.json({ success:false });
  }
}   