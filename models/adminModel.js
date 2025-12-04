const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 6,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
    },

    email: { type: String, required: true }, // NEW FIELD
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Admin", adminSchema);
