import nodemailer from "nodemailer";

export async function sendMail(url) {
  try {
    console.log("📧 Sending mail for:", url);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Google App Password
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_EMAIL,
      subject: "🚨 Site Down Alert",
      text: `${url} is DOWN`,
    });

    console.log("✅ Mail sent:", info.response);

  } catch (error) {
    console.log("❌ MAIL ERROR:", error);
  }
}