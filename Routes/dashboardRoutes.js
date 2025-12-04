const express = require("express");
const paymentModel = require("../models/paymentModel");
const donorModel = require("../models/donorModel");

const router = express.Router();

router.get("/get-reminders", async (req, res) => {
  try {
    // Populate the donor field to get donor details
    const reminders = await paymentModel.find()
      .populate("donor", "name email"); // only fetch name and email from donor

    res.status(200).json({
      message: "All Reminders fetched successfully",
      reminders
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/mark-paid/:id", async (req, res) => {
    try {
        const reminder = await paymentModel.findById(req.params.id);

        if (!reminder)
            return res.status(404).json({ message: "Reminder not found" });

        reminder.status = "paid";
        reminder.paymentDate = new Date();

        await reminder.save();

        res.status(200).json({
            message: "Marked as paid successfully",
            reminder,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;
