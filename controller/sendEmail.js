const { Resend } = require("resend");
const dotenv = require("dotenv");

dotenv.config();

const resend = new Resend("re_jZYBnYcN_GrhXs8CwzE7jF8BYfNPQbJB7");

async function sendEmail({ email, html, subject, attachments }) {
  try {
    const emailPayload = {
      from: "Kokan Education & Welfare Centre <onboarding@resend.dev>",
      to: email,
      subject,
      html,
    };

    // ✅ Attachments sirf tab add honge jab present ho
    if (attachments && attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const response = await resend.emails.send(emailPayload);

    console.log("✅ Email sent:", response.id);
    return { success: true, response };

  } catch (error) {
    console.error("❌ Email error:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = sendEmail;
