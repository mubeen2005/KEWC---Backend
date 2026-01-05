const express = require("express");
const donorModel = require("../models/donorModel");
const paymentModel = require("../models/paymentModel");
const qrcode = require("qrcode");
const sendEmail = require("../controller/sendEmail");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

/* ================= CREATE DONOR ================= */
router.post("/create-donor", async (req, res) => {
  try {
    const { name, email, upiId, donationAmount } = req.body;

    if (!name || !email || !upiId || !donationAmount) {
      return res.status(400).json({ message: "Please fill all details" });
    }

    const existingDonor = await donorModel.findOne({ email });
    if (existingDonor) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const donor = new donorModel({
      name,
      email,
      upiId,
      donationAmount,
    });
    await donor.save();

    const html = `
      <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #e6e6e6; border-radius:10px;">
        <div style="background:#0b77d1; color:white; padding:20px; text-align:center;">
          <h2>Kokan Education & Welfare Centre</h2>
          <p>Donor Registration Successful</p>
        </div>
        <div style="padding:20px;">
          <p>Assalamualaikum <b>${name}</b>,</p>
          <p>Your donor registration has been completed successfully.</p>
          <p><b>Donation Amount:</b> ₹${donationAmount}</p>
          <p>JazakAllah khair for supporting our mission.</p>
          <p>Regards,<br><b>Kokan Education & Welfare Centre</b></p>
        </div>
      </div>
    `;

    // send email in background
    sendEmail({
      email: email, // ✅ FIXED
      subject: "Welcome to KEWC – Registration Successful",
      html,
    }).catch(console.error);

    res.status(201).json({
      message: "Donor created successfully",
      donor,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET ALL DONORS ================= */
router.get("/get-donors", async (req, res) => {
  try {
    const donors = await donorModel.find();
    res.status(200).json({
      message: "Donors fetched successfully",
      donors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= DELETE DONOR ================= */
router.delete("/delete-donor/:id", async (req, res) => {
  try {
    const donor = await donorModel.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    await donorModel.findByIdAndDelete(req.params.id);

    const html = `
      <div style="font-family: Arial; max-width:600px; margin:auto;">
        <h2 style="background:#d62828; padding:15px; color:white; text-align:center;">
          Donor Account Removed
        </h2>
        <p>Assalamualaikum <b>${donor.name}</b>,</p>
        <p>Your donor account has been removed from our system.</p>
        <p>Regards,<br><b>Kokan Education & Welfare Centre</b></p>
      </div>
    `;

    sendEmail({
      email: donor.email, // ✅ FIXED
      subject: "Donor Account Deleted – KEWC",
      html,
    }).catch(console.error);

    res.status(200).json({
      message: "Donor deleted successfully",
      donor,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= SEND DONATION REMINDER ================= */
router.post("/send-reminder/:id", async (req, res) => {
  try {
    const donor = await donorModel.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    const amount = donor.donationAmount;
    const { UPI_ID, PHONE } = process.env;

    let payment = await paymentModel.findOne({
      donor: donor._id,
      status: "pending",
    });

    if (!payment) {
      payment = new paymentModel({
        donor: donor._id,
        amount,
        status: "pending",
      });
      await payment.save();
    }

    const upiPayload = `upi://pay?pa=${UPI_ID}&pn=Kokan%20Education%20%26%20Welfare%20Centre&am=${amount}&cu=INR&tn=Donation%20by%20${donor.name}`;
    const qrDataUrl = await qrcode.toDataURL(upiPayload);
    const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

    const html = `
      <div style="font-family: Arial; max-width:600px; margin:auto;">
        <h2 style="background:#0b77d1; padding:15px; color:white; text-align:center;">
          Donation Reminder – KEWC
        </h2>
        <p>Assalamualaikum <b>${donor.name}</b>,</p>
        <p>Your pending donation amount is <b>₹${amount}</b>.</p>
        <div style="text-align:center;">
          <img src="cid:qr@kewc" width="220" />
        </div>
        <p><b>UPI ID:</b> ${UPI_ID}</p>
        <p><b>Contact:</b> ${PHONE}</p>
      </div>
    `;

    sendEmail({
      email: donor.email, // ✅ FIXED
      subject: "Donation Reminder – KEWC",
      html,
      attachments: [
        {
          filename: "upi-qr.png",
          content: qrBuffer,
          cid: "qr@kewc",
        },
      ],
    }).catch(console.error);

    payment.lastReminderSent = new Date();
    await payment.save();

    res.status(200).json({
      message: "Reminder email sent successfully",
      payment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

