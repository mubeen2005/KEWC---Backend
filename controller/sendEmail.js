const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

// transporter (one time)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// reusable function
async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: `"KEWC" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent to:", to);
    return true;
  } catch (error) {
    console.error("❌ Email failed:", error.message);
    return false;
  }
}

// sendEmail({
//   to: "mubinshaikj666@gmail.com",
//   subject: "Donation Received",
//   html: `
//     <h2>Thank You 🙏</h2>
//     <p>Your donation has been successfully received.</p>
//     <p><b>Kokan Education & Welfare Centre</b></p>
//   `,
// });

module.exports = sendEmail;
