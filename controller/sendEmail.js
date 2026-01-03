const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

// ⚡ Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // ya koi aur SMTP (Outlook, Yahoo, etc.)
  auth: {
    user: process.env.EMAIL_USER,  // tumhara Gmail
    pass: process.env.EMAIL_PASS,  // Gmail App Password (2FA enabled hone par)
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
