const jwt = require("jsonwebtoken");
const User = require("../@user_entity/user.model");
const dotenv = require("dotenv");
const ErrorHandler = require("../utils/errorHandler");
const orderModel = require("../@order_entity/order.model");
dotenv.config({ path: "../config/config.env" });

exports.auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: `Authentication Expired` });
    }

    const { userId } = jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );

    req.userId = userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: `Something went Wrong` });
    }
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, status: 403, message: `Authentication Expired` });
  }
};

exports.getNewAccesstoken = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(404).json({ message: `Refresh Token not found` });
    }
    const { userId, exp } = jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.REFRESH_SECRET
    );
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: `Something went Wrong` });
    }
    const order = await orderModel.findOne({user:user._id,status:"Active"});
    if (order) {
      if (!user.device_ids.includes(req.headers.authorization.split(" ")[1])) {
        return next(
          new ErrorHandler("Your session is expired, please login", 401)
        );
      }
      const isTokenExpired = Date.now() >= exp * 1000;
      if (isTokenExpired) {
        user.device_ids = user.device_ids.filter(
          (token) => token != req.headers.authorization.split(" ")[1]
        );
        await user.save();
        return next(
          new ErrorHandler("Refresh token is expired, Please Login", 401)
        );
      }
    }

    const accessToken = await user.getAccessToken();
    res.status(200).send({
      accessToken,
      success: true,
    });
  } catch (error) {
    return res.status(401).json({ message: `Refresh Token Expired` });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(401).json({ message: "Forbidden:Admin Only" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized:Admin Only" });
  }
};
