const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: { type: String, required: true }, // NEW FIELD

  upiId: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  donationAmount: {
    type: Number,
    required: true
  },

  lastReminderSent: {
    type: Date,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model("Donor", donorSchema);
