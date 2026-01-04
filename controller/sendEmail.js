const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

// ⚡ Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
}); 

// ⚡ Send Email function
async function sendEmail({ email, subject, html, attachments = [] }) {
  try {
    const mailOptions = {
      from: `"Kokan Education & Welfare Centre"`,
      to: email,
      subject,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email} | Message ID: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error(`❌ Email to ${email} failed:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = sendEmail;
