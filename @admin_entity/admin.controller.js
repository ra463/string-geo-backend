const Transaction = require("../@transaction_entity/transaction.model");
const User = require("../@user_entity/user.model");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { generateUploadURL, s3Uploadv4 } = require("../utils/s3");
const dotenv = require("dotenv");
const Video = require("../@video-entity/video.model");
const genreModel = require("../@genre_entity/genre.model");
const languageModel = require("../@language_entity/language.model");
const categoriesModel = require("../@category_entity/category.model");
const { sendBulkEmail } = require("../utils/sendEmail");
const XLSX = require("xlsx");
const Order = require("../@order_entity/order.model");
const Query = require("../@query_entity/query.model");

dotenv.config({ path: "../config/config.env" });

const sendData = async (res, statusCode, user, message) => {
  const accessToken = await user.getAccessToken();
  // const refreshToken = await user.getRefreshToken();
  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
    // refreshToken,
    message,
  });
};

exports.adminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new ErrorHandler("Please enter email & password", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new ErrorHandler("Invalid email or password", 401));

  if (user.role !== "admin")
    return next(
      new ErrorHandler("You are not authorized to access this route", 403)
    );

  const isPasswordMatched = await user.matchPassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password", 401));

  sendData(res, 200, user, "Admin Logged In");
});

// exports.getAllUsers = catchAsyncError(async (req, res, next) => {
//   let query = {};
//   // plan_type ,plan_name
//   // console.log(query)
//   if (req.query.keyword) {
//     const keyword = req.query.keyword;
//     const numericKeyword = !isNaN(parseInt(keyword)) ? parseInt(keyword) : 1;
//     query["$or"] = [
//       { name: { $regex: keyword, $options: "i" } },
//       { email: { $regex: keyword, $options: "i" } },
//       { mobile: numericKeyword },
//     ];
//   }
//   const userCount = await User.countDocuments();

//   let users = await User.find(query).sort({ createdAt: -1 });

//   const filteredUsers = users.length;
//   if (req.query.resultPerPage && req.query.currentPage) {
//     let resultPerPage = Number(req.query.resultPerPage);
//     let currentPage = Number(req.query.currentPage);

//     let skip = resultPerPage * (currentPage - 1);
//     users = await users.slice(skip, skip + resultPerPage);
//   }

//   res.status(200).json({
//     success: true,
//     filteredUsers,
//     users,
//     userCount,
//   });
// });

exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const userCount = await User.countDocuments();

  let users = await User.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "orders",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user", "$$userId"] },
                  { $eq: ["$status", "Active"] },
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: "latestOrder",
      },
    },
    {
      $addFields: {
        latestOrder: { $arrayElemAt: ["$latestOrder", 0] },
      },
    },
  ]);

  if (req.query.plan_type) {
    users = users.filter(
      (user) =>
        user.latestOrder && user.latestOrder.plan_type === req.query.plan_type
    );
  }

  if (req.query.plan_name) {
    users = users.filter(
      (user) =>
        user.latestOrder && user.latestOrder.plan_name === req.query.plan_name
    );
  }

  if (req.query.keyword) {
    const keyword = req.query.keyword;
    users = users.filter(
      (user) =>
        user.name.toLowerCase().includes(keyword.toLowerCase()) ||
        user.email.toLowerCase().includes(keyword.toLowerCase()) ||
        (user.mobile && user.mobile.toString().includes(keyword))
    );
  }

  const filteredUsers = users.length;

  if (req.query.resultPerPage && req.query.currentPage) {
    let resultPerPage = Number(req.query.resultPerPage);
    let currentPage = Number(req.query.currentPage);

    let skip = resultPerPage * (currentPage - 1);
    users = users.slice(skip, skip + resultPerPage);
  }

  res.status(200).json({
    success: true,
    filteredUsers,
    users,
    userCount,
  });
});

exports.getUserSubscriptionHistory = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const transaction = await Transaction.find({ user: user._id })
    .populate({
      path: "order",
      select: "plan plan_type",
      populate: {
        path: "plan",
        select: "name",
      },
    })
    .lean();

  const userData = {
    name: user.name,
    email: user.email,
    country_code: user.country_code ? user.country_code : "",
    mobile: user.mobile,
    avatar: user.avatar,
    address: user.city + " " + user.district + " " + user.states,
    subscriptionHistory: transaction,
  };

  res.status(200).json({
    success: true,
    data: userData,
  });
});

exports.downloadAsCsv = catchAsyncError(async (req, res, next) => {
  const allowModels = ["User", "Transaction", "Query"];
  const models = {
    User: User,
    Transaction: Transaction,
    Query: Query,
  };

  if (!allowModels.includes(req.query.Model)) {
    return next(new ErrorHandler("Module Not Found", 404));
  }

  const allowFields = {
    User: ["name", "email", "mobile", "role", "states", "city", "country"],
    Transaction: ["razorpay_payment_id", "gateway", "amount", "status"],
    Query: ["name", "email", "mobile", "address", "message", "company_name"],
  };

  const fieldsToExclude = "-_id";

  const data = await models[req.query.Model]
    .find({})
    .select(`${fieldsToExclude} ${allowFields[req.query.Model].join(" ")}`)
    .lean();

  if (data.length === 0) {
    return next(new ErrorHandler(`No ${req.query.Model} Found`, 404));
  }

  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Write the workbook to a buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  // Set response headers
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=users.xlsx");

  // Send the buffer as the response
  // console.log(buffer)
  res.status(200).send(buffer);
});

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});

exports.getUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const transactions = await Transaction.find({ user: user._id })
    .populate("user", "email")
    .populate("order")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "User Found Successfully",
    user,
    user_transactions: transactions,
  });
});

exports.updateUserProfile = catchAsyncError(async (req, res, next) => {
  const { name, email, password, mobile, country, states, city } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler("User not found", 400));

  let location = "";
  if (req.file) {
    const result = await s3Uploadv4(req.file, req.params.id);
    location = result.Location;
  }
  if (name) user.name = name;
  if (email) user.email = email;
  if (password) user.password = password;
  if (mobile) user.mobile = mobile;
  if (country) user.country = country;
  if (states) user.states = states;
  if (city) user.city = city;
  user.country_code = "+91";
  if (location) user.avatar = location;

  await user.save();
  console.log(user);
  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
    user: {
      email: user.email,
      name: user.name,
      mobile: user.mobile,
      avatar: user.avatar,
    },
  });
});

exports.createUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password, mobile, states, country, city } = req.body;

  const user_exist = await User.findOne({
    $or: [{ email: { $regex: new RegExp(email, "i") } }, { mobile }],
  });

  if (user_exist && user_exist.is_verified) {
    return next(
      new ErrorHandler(
        `${user_exist.email ? "Email" : "Mobile"} already exists`,
        400
      )
    );
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    mobile,
    states,
    country,
    city,
    country_code: "+91",
    is_verified: true,
  });

  res.status(200).json({
    success: true,
    user,
    message: "User Created Successfully",
  });
});

exports.getURL = catchAsyncError(async (req, res, next) => {
  const data = await generateUploadURL();
  if (!data) return next(new ErrorHandler("URL not found", 404));

  res.status(200).json({
    success: true,
    data,
  });
});

// exports.getSingnedUrls = catchAsyncError(async (req, res, next) => {
//   const key = process.env.KEY_CLOUD;
//   const pemKey = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
//   const signedUrl = getSignedUrl({
//     keyPairId: process.env.ID_CLOUD,
//     privateKey: pemKey,
//     url: "https://d3i0jph7swoo8z.cloudfront.net/file_example.mp4",
//     dateLessThan: new Date(Date.now() + process.env.EXPIRE_TIME),
//   });
//   return res.status(200).json({ success: true, signedUrl });
// });

exports.getHomeData = catchAsyncError(async (req, res, next) => {
  const [users, transactions, genres, languages, categories, videos] =
    await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      genreModel.countDocuments(),
      languageModel.countDocuments(),
      categoriesModel.countDocuments(),
      Video.countDocuments(),
    ]);

  const today = new Date(); // Get today's date
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        start_date: { $gte: startOfDay }, // Filter orders for today or later
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: {
            $cond: {
              if: { $ifNull: ["$inr_price", false] }, // If inr_price exists
              then: "$inr_price", // Use inr_price directly
              else: { $multiply: ["$usd_price", 83] }, // Calculate inr_price based on usd_price and exchange rate
            },
          },
        },
      },
    },
  ]);

  const startOfWeek = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - today.getDay()
  );
  const weeklyRevenue = await Order.aggregate([
    {
      $match: {
        start_date: { $gte: startOfWeek },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: {
            $cond: {
              if: { $ifNull: ["$inr_price", false] },
              then: "$inr_price",
              else: { $multiply: ["$usd_price", 83] },
            },
          },
        },
      },
    },
  ]);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        start_date: { $gte: startOfMonth }, // Filter orders for this month or later
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: {
            $cond: {
              if: { $ifNull: ["$inr_price", false] }, // If inr_price exists
              then: "$inr_price", // Use inr_price directly
              else: { $multiply: ["$usd_price", 83] }, // Calculate inr_price based on usd_price and exchange rate
            },
          },
        },
      },
    },
  ]);

  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const yearlyRevenue = await Order.aggregate([
    {
      $match: {
        start_date: { $gte: startOfYear }, // Filter orders for this year or later
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: {
            $cond: {
              if: { $ifNull: ["$inr_price", false] }, // If inr_price exists
              then: "$inr_price", // Use inr_price directly
              else: { $multiply: ["$usd_price", 83] }, // Calculate inr_price based on usd_price and exchange rate
            },
          },
        },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      yearlyRevenue: yearlyRevenue.length ? yearlyRevenue[0].totalRevenue : 0,
      monthlyRevenue: monthlyRevenue.length
        ? monthlyRevenue[0].totalRevenue
        : 0,
      weeklyRevenue: weeklyRevenue.length ? weeklyRevenue[0].totalRevenue : 0,
      dailyRevenue: dailyRevenue.length ? dailyRevenue[0].totalRevenue : 0,
      users,
      transactions,
      genres,
      languages,
      categories,
      videos,
    },
  });
});

exports.sendBulkEmails = catchAsyncError(async (req, res, next) => {
  const users = await User.find({ role: "user", is_verified: true });
  const { subject, description } = req.body;
  const emails = users.map((user) => user.email);
  // console.log(emails);

  await sendBulkEmail(emails, subject, description);
  res.status(200).json({
    success: true,
    message: "Email Send Successfully",
  });
});
