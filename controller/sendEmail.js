const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
});


async function sendEmail({ email, subject, html, attachments = [] }) {
  try {
    const info = await transporter.sendMail({
      from: `"Kokan Education & Welfare Centre" <${process.env.BREVO_USER}>`,
      to: email,
      subject,
      html,
      attachments,
    });

    console.log("✅ Email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Email failed:", error);
    return { success: false, error: error.message };
  }
}

module.exports = sendEmail;
