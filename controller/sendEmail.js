const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend("re_jZYBnYcN_GrhXs8CwzE7jF8BYfNPQbJB7");

async function sendEmail({ email, subject, html, attachments = [] }) {
  try {
    const response = await resend.emails.send({
      from: "Kokan Education & Welfare Centre <onboarding@resend.dev>",
      to: email,
      subject,
      html,
      attachments,
    });
    console.log(`✅ Email sent to ${email} | ID: ${response.id}`);
    return { success: true, response };
  } catch (error) {
    console.error(`❌ Email to ${email} failed:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = sendEmail;
