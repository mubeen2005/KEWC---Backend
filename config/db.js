const mongoose = require("mongoose");
require("dotenv").config();

const connection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_LINK);

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.log("MongoDB Error: ", error);
  }
};

module.exports = connection;
