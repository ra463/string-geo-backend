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
const userRoutes = require("./user_entity/user.index");
const planRoutes = require("./plan_entity/plan.index");
const subscriptionRoutes = require("./subscription_entity/subscription.index");
const { error } = require("./middlewares/Error");

// use routes
app.use("/api/user", userRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/subscription",subscriptionRoutes);
app.all("*",(req,res,next)=>{
  res.status(404).send({
    status:404,
    message:"route not found"
  })
})
app.use(error);
module.exports = app;
