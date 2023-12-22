const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config({
  path: "./config/config.env",
});

app.use(express.json());
app.use(helmet());
app.use(morgan("tiny"));
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: "Too many requests from this IP, please try again later.",
  headers: false,
});
app.use(limiter);
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// import routes
const userRoutes = require("./routes/userRoutes");
const { error } = require("./middlewares/Error");

// use routes
app.use("/api/user", userRoutes);

module.exports = app;

app.use(error);
