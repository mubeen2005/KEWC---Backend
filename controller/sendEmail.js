const Brevo = require('@getbrevo/brevo');
require("dotenv").config();

const defaultClient = Brevo.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];

// Render ke Dashboard mein 'BREVO_API_KEY' naam se key add karein
apiKey.apiKey = process.env.BREVO_API_KEY; 

const apiInstance = new Brevo.TransactionalEmailsApi();

async function sendEmail({ to, subject, html }) {
  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  
  // Sahi sender details
  sendSmtpEmail.sender = { 
    "name": "Kokan Education Welfare Center", 
    "email": "kokaneducationwelfarecenter@gmail.com" 
  }; 
  
  sendSmtpEmail.to = [{ "email": to }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Brevo Email Sent! ID:', data.messageId);
    return true;
  } catch (error) {
    // Detailed error logging
    console.error('❌ Brevo Error:', error.response ? JSON.stringify(error.response.body) : error.message);
    return false;
  }
}

module.exports = sendEmail;