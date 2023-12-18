const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const app = express();
dotenv.config({
  path: "./config/config.env",
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// import routes
const userRoutes = require("./routes/userRoutes");

// use routes
app.use("/api/user", userRoutes);

module.exports = app;
