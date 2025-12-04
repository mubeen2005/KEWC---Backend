const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors")
const connection = require("./config/db");
const adminRoutes = require("./Routes/adminRoutes")
const donorRoutes = require("./Routes/donorRoutes")
const dashboardRoutes = require("./Routes/dashboardRoutes")

const app = express();
dotenv.config();
connection();

app.use(express.json())
app.use(cors({ origin: "*" })); 

const PORT = process.env.PORT;

app.use("/api/admin/",adminRoutes)
app.use("/api/donor/",donorRoutes)
app.use("/api/dashboard/",dashboardRoutes)


app.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`)
})
