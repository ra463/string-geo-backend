const express = require("express");
const cors = require("cors");
const app = express();
const { error } = require("./middlewares/error");
const dotenv = require("dotenv");
const morgan = require("morgan");
// const ip = require("ip");
const requestIp = require("request-ip");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config({
  path: "./config/config.env",
});

app.use(express.json());
app.use(helmet());
app.use(morgan("tiny"));
// app.set("trust proxy", 1);
// app.use(requestIp.mw());
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
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// import routes
const userRoutes = require("./@user_entity/user.index");
const planRoutes = require("./@plan_entity/plan.index");
const orderRoutes = require("./@order_entity/order.index");
const adminRoutes = require("./@admin_entity/admin.index");
const transactionRoutes = require("./@transaction_entity/transaction.index");
const languageRoutes = require("./@language_entity/language.index");
const genreRoutes = require("./@genre_entity/genre.index");
const videoRoutes = require("./@video-entity/video.index");
const actorRoutes = require("./@actor_entity/actor.index");
const directorRoutes = require("./@director_entity/director.index");

//import validators
const userValidator = require("./@user_entity/user.validator");
const planValidator = require("./@plan_entity/plan.validator");
const adminValidator = require("./@admin_entity/admin.validator");
const transactionValidator = require("./@transaction_entity/transaction.validator");
const languageValidator = require("./@language_entity/language.validator");
const genreValidator = require("./@genre_entity/genre.validator");
const videoValidator = require("./@video-entity/video.validator");
const actorValidator = require("./@actor_entity/actor.validator");
const directorValidator = require("./@director_entity/director.validator");

// use routes
app.use("/api/user", userValidator, userRoutes);
app.use("/api/plan", planValidator, planRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/admin", adminValidator, adminRoutes);
app.use("/api/transaction", transactionValidator, transactionRoutes);
app.use("/api/language", languageValidator, languageRoutes);
app.use("/api/genre", genreValidator, genreRoutes);
app.use("/api/video", videoValidator, videoRoutes);
app.use("/api/actor", actorValidator, actorRoutes);
app.use("/api/director", directorValidator, directorRoutes);

app.get("/", (req, res) =>
  res.send(`<h1>Its working. Click to visit Link.</h1>`)
);

app.all("*", (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;

app.use(error);
