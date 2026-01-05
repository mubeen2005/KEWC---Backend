const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true only for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ email, subject, html, attachments = [] }) {
  try {
    await transporter.sendMail({
      from: `"KEWC" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
      attachments,
    });

    console.log("✅ Email sent to:", email);
    return true;
  } catch (error) {
    console.error("❌ Email failed:", error.message);
    return false;
  }
}

module.exports = sendEmail;
