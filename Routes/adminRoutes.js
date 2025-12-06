const express = require("express");
const adminModel = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();
const router = express.Router();

/* ------------------ EMAIL TRANSPORTER ------------------ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,  // Gmail address
    pass: process.env.EMAIL_PASS,  // App password
  },
});

/* ------------------ SEND REGISTRATION EMAIL ------------------ */
async function sendAdminRegistrationEmail(email, fullName, username, password) {
  try {
    await transporter.sendMail({
      from: `"Kokan Education & Welfare Centre" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Admin Registration Successful - KEWC",
      html: `
        <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #eee; border-radius:10px;">
          <div style="background:#0b77d1; padding:20px; color:white; text-align:center;">
            <h2 style="margin:0;">Kokan Education & Welfare Centre</h2>
            <p style="margin:5px 0 0;">Admin Registration</p>
          </div>

          <div style="padding:20px;">
            <p>Assalamualaikum <b>${fullName}</b>,</p>
            <p>Aapka admin account successfully create ho chuka hai.</p>

            <p><b>Login Details:</b></p>
            <ul>
              <li>Fullname: <b>${fullName}</b></li>
              <li>Username: <b>${username}</b></li>
              <li>Email: <b>${email}</b></li>
              <li>Password: <b>${password}</b></li>
            </ul>

            <p>Aap <a href="${process.env.ADMIN_PANEL_URL}" target="_blank">KEWC Admin Panel</a> par login kar sakte hain.</p>

            <p>JazakAllah khair.</p>
            <p>Regards,<br><b>Kokan Education & Welfare Centre</b></p>
          </div>

          <div style="background:#f9f9f9; padding:10px; text-align:center; font-size:12px; color:#777;">
            This is an automated email. Please do not reply.
          </div>
        </div>
      `,
    });

    console.log("✅ Admin registration email sent.");
  } catch (err) {
    console.error("❌ Email sending error:", err);
  }
}

/* ------------------ SEND DELETE EMAIL ------------------ */
async function sendAdminDeletionEmail(email, fullName) {
  try {
    await transporter.sendMail({
      from: `"Kokan Education & Welfare Centre" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Admin Account Deleted - KEWC",
      html: `
       <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #eee; border-radius:10px;">
          <div style="background:#d62828; padding:20px; color:white; text-align:center;">
            <h2 style="margin:0;">Kokan Education & Welfare Centre</h2>
            <p style="margin:5px 0 0;">Admin Account Removal</p>
          </div>

          <div style="padding:20px;">
            <p>Assalamualaikum <b>${fullName}</b>,</p>
            <p>Aapka admin account KEWC system se remove kar diya gaya hai.</p>
            <p>Ab aap admin panel access nahi kar sakenge.</p>
            <p>Agar yeh galti se hua hai toh please management se contact karein.</p>
          </div>

          <div style="background:#f9f9f9; padding:10px; text-align:center; font-size:12px; color:#777;">
            This is an automated email. Please do not reply.
          </div>
        </div>
      `,
    });

    console.log("✅ Admin deletion email sent.");
  } catch (err) {
    console.error("❌ Email sending error:", err);
  }
}

/* ------------------ GET ALL ADMINS ------------------ */
router.get("/get-admins", async (req, res) => {
  try {
    const admins = await adminModel.find().select("-password");
    res.status(200).json({ message: "Admins fetched successfully", admins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------ CREATE ADMIN ------------------ */
router.post("/create-admin", async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;

    if (!username || !fullName || !email || !password) {
      return res.status(400).json({ message: "Please fill all details" });
    }

    const existingAdmin = await adminModel.findOne({ username });
    if (existingAdmin) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newAdmin = new adminModel({
      username,
      fullName,
      email,
      password: hashPassword,
    });

    await newAdmin.save();

    // email send in background
    sendAdminRegistrationEmail(email, fullName, username, password);

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------ LOGIN ADMIN ------------------ */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Please fill all details" });
    }

    const admin = await adminModel.findOne({ username });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------ DELETE ADMIN ------------------ */
router.delete("/delete-admin/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const adminExist = await adminModel.findById(id);
    if (!adminExist) return res.status(404).json({ message: "Admin not found" });

    await adminModel.findByIdAndDelete(id);

    // email send in background
    sendAdminDeletionEmail(adminExist.email, adminExist.fullName);

    res.status(200).json({
      message: "Admin deleted successfully",
      admin: {
        id: adminExist._id,
        username: adminExist.username,
        fullName: adminExist.fullName,
        email: adminExist.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
