const express = require("express");
const adminModel = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const sendEmail = require("../controller/sendEmail");

dotenv.config();
const router = express.Router();

/* ------------------ ADMIN REGISTRATION EMAIL ------------------ */
function sendAdminRegistrationEmail(email, fullName, username, password) {
  const html = `
    <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #eee; border-radius:10px;">
      <div style="background:#0b77d1; padding:20px; color:white; text-align:center;">
        <h2>Kokan Education & Welfare Centre</h2>
        <p>Admin Registration</p>
      </div>
      <div style="padding:20px;">
        <p>Assalamualaikum <b>${fullName}</b>,</p>
        <p>Aapka admin account successfully create ho chuka hai.</p>
        <ul>
          <li><b>Full Name:</b> ${fullName}</li>
          <li><b>Username:</b> ${username}</li>
          <li><b>Email:</b> ${email}</li>
          <li><b>Password:</b> ${password}</li>
        </ul>
        <p>
          Login here:
          <a href="${process.env.ADMIN_PANEL_URL}" target="_blank">KEWC Admin Panel</a>
        </p>
        <p>Regards,<br/><b>Kokan Education & Welfare Centre</b></p>
      </div>
    </div>
  `;

  // Async background email
  sendEmail({ email, subject: "Admin Registration Successful - KEWC", html })
    .then(res => console.log("✅ Admin registration email sent:", res))
    .catch(err => console.error("❌ Admin registration email failed:", err));
}

/* ------------------ ADMIN DELETION EMAIL ------------------ */
function sendAdminDeletionEmail(email, fullName) {
  const html = `
    <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #eee; border-radius:10px;">
      <div style="background:#d62828; padding:20px; color:white; text-align:center;">
        <h2>Kokan Education & Welfare Centre</h2>
        <p>Admin Account Removal</p>
      </div>
      <div style="padding:20px;">
        <p>Assalamualaikum <b>${fullName}</b>,</p>
        <p>Aapka admin account system se remove kar diya gaya hai.</p>
        <p>Agar yeh mistake hai toh management se contact karein.</p>
        <p>Regards,<br/><b>Kokan Education & Welfare Centre</b></p>
      </div>
    </div>
  `;

  sendEmail({ email, subject: "Admin Account Deleted - KEWC", html })
    .then(res => console.log("✅ Admin deletion email sent:", res))
    .catch(err => console.error("❌ Admin deletion email failed:", err));
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
    if (existingAdmin) return res.status(409).json({ message: "Username already taken" });

    const hashPassword = await bcrypt.hash(password, 10);

    const newAdmin = new adminModel({ username, fullName, email, password: hashPassword });
    await newAdmin.save();

    // Email in background
    sendAdminRegistrationEmail(email, fullName, username, password);

    res.status(201).json({
      message: "Admin created successfully",
      admin: { id: newAdmin._id, username, fullName, email },
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
    if (!username || !password) return res.status(400).json({ message: "Please fill all details" });

    const admin = await adminModel.findOne({ username });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      message: "Login successful",
      token,
      admin: { id: admin._id, username: admin.username, fullName: admin.fullName, email: admin.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------ DELETE ADMIN ------------------ */
router.delete("/delete-admin/:id", async (req, res) => {
  try {
    const adminExist = await adminModel.findById(req.params.id);
    if (!adminExist) return res.status(404).json({ message: "Admin not found" });

    await adminModel.findByIdAndDelete(req.params.id);

    // Email in background
    sendAdminDeletionEmail(adminExist.email, adminExist.fullName);

    res.status(200).json({
      message: "Admin deleted successfully",
      admin: { id: adminExist._id, username: adminExist.username, fullName: adminExist.fullName, email: adminExist.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
