const express = require("express");
const cors = require("cors");
const app = express();
const { error } = require("./middlewares/error");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("./utils/cronJobs");

dotenv.config({
  path: "./config/config.env",
});

app.use(express.json());
app.use(helmet());
app.use(morgan("tiny"));
const limiter = rateLimit({
  windowMs: process.env.TIME,
  max: process.env.MAX,
  message: "Too many requests from this IP, please try again later.",
  headers: false,
});
// app.use(limiter);
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
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
const categoryRoutes = require("./@category_entity/category.index");
const queryRoutes = require("./@query_entity/query.index");
const couponRoutes = require("./@coupon_entity/coupon.index");
const pageRoutes = require("./@page_entity/page.index");
const faqRoutes = require("./@faq_entity/faq.index");
const trailerRoutes = require("./@trailer_entity/trailer.index");
const carouselRoutes = require("./@carousel_entity/carousel.index");
const contactRoutes = require("./@contact_entity/contact.index");
const aboutRoutes = require("./@about_entity/about.index");

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
const categoryValidator = require("./@category_entity/category.validator");
const queryValidator = require("./@query_entity/query.validator");
const couponValidator = require("./@coupon_entity/coupon.validator");
const pageValidator = require("./@page_entity/page.validator");
const faqValidator = require("./@faq_entity/faq.validator");
const trailerValidator = require("./@trailer_entity/trailer.validator");
const carouselValidator = require("./@carousel_entity/carousel.validator");
const contactValidator = require("./@contact_entity/contact.validator");
const aboutValidator = require("./@about_entity/about.validator");

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
app.use("/api/category", categoryValidator, categoryRoutes);
app.use("/api/query", queryValidator, queryRoutes);
app.use("/api/coupon", couponValidator, couponRoutes);
app.use("/api/page", pageValidator, pageRoutes);
app.use("/api/faq", faqValidator, faqRoutes);
app.use("/api/trailer", trailerValidator, trailerRoutes);
app.use("/api/carousel", carouselValidator, carouselRoutes);
app.use("/api/contact", contactValidator, contactRoutes);
app.use("/api/about", aboutValidator, aboutRoutes);

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
