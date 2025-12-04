const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

async function sendEmail({ email, html, subject, attachments = [] }) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "kokaneducationwelfarecenter@gmail.com",
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: "Kokan Education & Welfare Centre <kokaneducationwelfarecenter@gmail.com>",
      to: email,
      subject,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };

  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error: error.message };
  }
}

module.exports = sendEmail;
