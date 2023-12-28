const express = require("express");
const cors = require("cors");
const app = express();
const { error } = require("./middlewares/Error");
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
app.set("trust proxy", "loopback");
const limiter = rateLimit({
  windowMs: process.env.TIME,
  max: process.env.MAX,
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
const userRoutes = require("./@user_entity/user.index");
const planRoutes = require("./@plan_entity/plan.index");
const orderRoutes = require("./@order_entity/order.index");

//import validators
const userValidator = require("./@user_entity/user.validator");
const planValidator = require("./@plan_entity/plan.validator");
// const orderValidator = require("./@order_entity/order.validator");

// use routes
app.use("/api/user", userValidator, userRoutes);
app.use("/api/plan", planValidator, planRoutes);
app.use("/api/order", orderRoutes);

app.all("*", (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;

app.use(error);
