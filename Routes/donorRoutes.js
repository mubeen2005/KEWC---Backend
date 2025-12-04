const express = require("express");
const donorModel = require("../models/donorModel");
const qrcode = require("qrcode");
const sendEmail = require("../controller/sendEmail");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const paymentModel = require("../models/paymentModel")

dotenv.config();

const router = express.Router();

/* ------------------------------------------------------
    📌 1. CREATE DONOR + SEND REGISTRATION EMAIL
---------------------------------------------------------*/
router.post("/create-donor", async (req, res) => {
    try {
        const { name, email, upiId, donationAmount } = req.body;

        if (!name || !email || !upiId || !donationAmount) {
            return res.status(400).json({ message: "Please fill all details" });
        }

        // Check duplicates
        const isExistDonor = await donorModel.findOne({ email });
        if (isExistDonor) {
            return res.status(409).json({ message: "Email already registered" });
        }

        // Create donor
        const donor = new donorModel({ name, email, upiId, donationAmount });
        await donor.save();

        // Nodemailer Transport
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const subject = "Welcome to Kokan Education & Welfare Centre - Registration Successful";

        const message = `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #e6e6e6; border-radius:10px;">
            <div style="background:#0b77d1; color:white; padding:20px; text-align:center;">
                <h2 style="margin:0;">Kokan Education & Welfare Centre</h2>
                <p style="margin:5px 0 0;">Donor Registration Successful</p>
            </div>
            <div style="padding:20px; color:#333;">
                <p>Assalamualaikum <b>${name}</b>,</p>

                <p>Alhamdulillah! Aapka donor registration <b>successfully complete</b> ho gaya hai.</p>

                <p>Hamari organization me aapka swagat hai! Aapka support hamare education aur welfare projects ke liye qeemti hai.</p>

                <div style="background:#f7f7f7; padding:15px; border-radius:8px; margin-top:10px;">
                    <p><b>Name:</b> ${name}</p>
                    <p><b>Email:</b> ${email}</p>
                    <p><b>UPI ID:</b> ${upiId}</p>
                    <p><b>Donation Amount:</b> ₹${donationAmount}</p>
                </div>

                <p style="margin-top:20px;">JazakAllah khair for joining our mission.</p>

                <p>Regards,<br><b>Kokan Education & Welfare Centre</b></p>
            </div>

            <div style="background:#fafafa; padding:12px; text-align:center; font-size:12px;">
                Together, we can make a difference.
            </div>
        </div>
        `;

        // Send Email
        const mailOptions = {
            from: `"Kokan Education & Welfare Centre" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            html: message,
        };

        await transporter.sendMail(mailOptions);

        return res.status(201).json({ message: "Donor created and email sent", donor });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error", error });
    }
});

/* ------------------------------------------------------
    📌 2. GET ALL DONORS
---------------------------------------------------------*/
router.get("/get-donors", async (req, res) => {
    try {
        const donors = await donorModel.find();
        res.status(200).json({ message: "Donors fetched successfully", donors });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

/* ------------------------------------------------------
    📌 3. DELETE DONOR + SEND EMAIL
---------------------------------------------------------*/
router.delete("/delete-donor/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const donor = await donorModel.findById(id);
        if (!donor) {
            return res.status(404).json({ message: "Donor not found" });
        }

        await donorModel.findByIdAndDelete(id);

        // Send Delete Email with Admin-style HTML
        await sendEmail({
            email: donor.email,
            subject: "Donor Account Deleted - KEWC",
            html: `
                <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #eee; border-radius:10px;">
                    <div style="background:#d62828; padding:20px; color:white; text-align:center;">
                        <h2 style="margin:0;">Kokan Education & Welfare Centre</h2>
                        <p style="margin:5px 0 0;">Donor Account Removal</p>
                    </div>

                    <div style="padding:20px;">
                        <p>Assalamualaikum <b>${donor.name}</b>,</p>
                        <p>Aapka donor account KEWC system se successfully remove kar diya gaya hai.</p>
                        <p>Ab aap donor panel access nahi kar sakenge.</p>
                        <p>Agar aapko lagta hai ki yeh galti se hua hai toh please management se contact karein.</p>
                        <p>Regards,<br><b>Kokan Education & Welfare Centre</b></p>
                    </div>

                    <div style="background:#f9f9f9; padding:10px; text-align:center; font-size:12px; color:#777;">
                        This is an automated email. Please do not reply.
                    </div>
                </div>
            `
        });

        res.status(200).json({
            message: "Donor deleted & email sent",
            deleted: donor
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

/* ------------------------------------------------------
    📌 4. SEND REMINDER EMAIL
---------------------------------------------------------*/
router.post("/send-reminder/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const donor = await donorModel.findById(id);
        if (!donor) return res.status(404).json({ message: "Donor not found" });

        const amount = donor.donationAmount;
        const donorName = donor.name;
        const UPI_ID = process.env.UPI_ID;
        const PHONE = process.env.PHONE;

        // -------------------- 1️⃣ Store Payment in DB --------------------
        let payment = await paymentModel.findOne({ donor: donor._id, status: "pending" });
        if (!payment) {
            payment = new paymentModel({
                donor: donor._id,
                amount,
                status: "pending",
            });
            await payment.save();
        }

        // -------------------- 2️⃣ Generate QR code --------------------
        const upiPayloadRaw = `upi://pay?pa=${UPI_ID}&pn=Kokan%20Education%20%26%20Welfare%20Centre&am=${amount}&cu=INR&tn=Donation%20by%20${donorName}`;
        const qrDataUrl = await qrcode.toDataURL(upiPayloadRaw, {
            errorCorrectionLevel: "H",
            type: "image/png",
            margin: 1,
            width: 400,
        });
        const base64Data = qrDataUrl.split(",")[1];
        const qrBuffer = Buffer.from(base64Data, "base64");

        // -------------------- 3️⃣ Email Message --------------------
        const message = `
            <div style="font-family: Arial; max-width:600px; margin:auto;">
                <h2 style="background:#0b77d1; padding:15px; color:white; text-align:center;">
                    Donation Reminder - Kokan Education & Welfare Centre
                </h2>
                <p>Assalamualaikum <b>${donorName}</b>,</p>
                <p>Aapka donation amount <b>₹${amount}</b> abhi tak receive nahi hua.</p>
                <p>Please neeche diye gaye QR code se payment kar dein.</p>

                <div style="text-align:center;">
                    <img src="cid:qrinline@kewc" style="width:250px;" />
                </div>

                <p><b>UPI ID:</b> ${UPI_ID}</p>
                <p><b>Paytm Phone Number:</b> ${PHONE}</p>

                <p>JazakAllah khair.</p>
            </div>
        `;

        // -------------------- 4️⃣ Send Email --------------------
        const sent = await sendEmail({
            email: donor.email,
            subject: "Donation Reminder",
            html: message,
            attachments: [
                {
                    filename: "qr.png",
                    content: qrBuffer,
                    cid: "qrinline@kewc"
                }
            ]
        });

        // -------------------- 5️⃣ Update lastReminderSent --------------------
        payment.lastReminderSent = new Date();
        await payment.save();

        res.json({ message: "Reminder email sent & payment stored", payment, info: sent });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


module.exports = router;
