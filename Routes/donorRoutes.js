const express = require("express");
const donorModel = require("../models/donorModel");
const paymentModel = require("../models/paymentModel");
const qrcode = require("qrcode");
const sendEmail = require("../controller/sendEmail");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

/* ------------------ CREATE DONOR ------------------ */
router.post("/create-donor", async (req, res) => {
  try {
    const { name, email, upiId, donationAmount } = req.body;
    if (!name || !email || !upiId || !donationAmount)
      return res.status(400).json({ message: "Please fill all details" });

    const existingDonor = await donorModel.findOne({ email });
    if (existingDonor)
      return res.status(409).json({ message: "Email already registered" });

    const donor = new donorModel({ name, email, upiId, donationAmount });
    await donor.save();

    // Background email with proper logging
    sendEmail({
      email,
      subject: "Welcome to KEWC - Donor Registration",
      html: `
        <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #eee; border-radius:10px;">
          <div style="background:#0b77d1; padding:20px; color:white; text-align:center;">
            <h2>Kokan Education & Welfare Centre</h2>
            <p>Donor Registration Successful</p>
          </div>
          <div style="padding:20px;">
            <p>Assalamualaikum <b>${name}</b>,</p>
            <p>Alhamdulillah! Your donor registration is successful.</p>
            <p><b>Name:</b> ${name}</p>
            <p><b>Email:</b> ${email}</p>
            <p><b>UPI ID:</b> ${upiId}</p>
            <p><b>Donation Amount:</b> ₹${donationAmount}</p>
            <p>Regards,<br/><b>KEWC</b></p>
          </div>
        </div>
      `,
    });

    res.status(201).json({ message: "Donor created successfully", donor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ------------------ DELETE DONOR ------------------ */
router.delete("/delete-donor/:id", async (req, res) => {
  try {
    const donor = await donorModel.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    await donorModel.findByIdAndDelete(req.params.id);

    sendEmail({
      email: donor.email,
      subject: "Donor Account Deleted - KEWC",
      html: `
        <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #eee; border-radius:10px;">
          <div style="background:#d62828; padding:20px; color:white; text-align:center;">
            <h2>KEWC</h2>
            <p>Donor Account Removed</p>
          </div>
          <div style="padding:20px;">
            <p>Assalamualaikum <b>${donor.name}</b>,</p>
            <p>Your donor account has been removed from our system.</p>
            <p>Regards,<br/><b>KEWC</b></p>
          </div>
        </div>
      `,
    });

    res.status(200).json({ message: "Donor deleted successfully", deleted: donor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ------------------ SEND DONATION REMINDER ------------------ */
router.post("/send-reminder/:id", async (req, res) => {
  try {
    const donor = await donorModel.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    const { donationAmount: amount, name: donorName } = donor;
    const { UPI_ID, PHONE } = process.env;

    let payment = await paymentModel.findOne({ donor: donor._id, status: "pending" });
    if (!payment) {
      payment = new paymentModel({ donor: donor._id, amount, status: "pending" });
      await payment.save();
    }

    const qrDataUrl = await qrcode.toDataURL(
      `upi://pay?pa=${UPI_ID}&pn=KEWC&am=${amount}&cu=INR&tn=Donation%20by%20${donorName}`,
      { errorCorrectionLevel: "H", width: 400 }
    );
    const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

    sendEmail({
      email: donor.email,
      subject: "Donation Reminder - KEWC",
      html: `
        <div style="font-family: Arial; max-width:600px; margin:auto;">
          <h2 style="background:#0b77d1; padding:15px; color:white; text-align:center;">Donation Reminder</h2>
          <p>Assalamualaikum <b>${donorName}</b>,</p>
          <p>Your donation amount <b>₹${amount}</b> is still pending.</p>
          <div style="text-align:center;">
            <img src="cid:qrinline@kewc" style="width:250px;" />
          </div>
          <p><b>UPI ID:</b> ${UPI_ID}</p>
          <p><b>Phone:</b> ${PHONE}</p>
        </div>
      `,
      attachments: [
        { filename: "qr.png", content: qrBuffer, cid: "qrinline@kewc" },
      ],
    });

    payment.lastReminderSent = new Date();
    await payment.save();

    res.status(200).json({ message: "Reminder email sent", payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
