const jwt = require("jsonwebtoken");
const User = require("../user_entity/user.model");
const dotenv = require("dotenv");
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
    return res.status(401).json({ message: `Authentication Expired` });
  }
};

exports.getNewAccesstoken = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: `Refresh Token Expired` });
    }

    const { userId } = jwt.verify(
      req.headers.authorization,
      process.env.REFRESH_SECRET
    );
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: `Something went Wrong` });
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
   
    if (!req.headers.authorization) {
      return res.status(401).json({ message: `Authentication Expired` });
    }

    const { userId } = await jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );
    req.adminId = userId;
  
    const admin = await User.findById(userId);
    if (!admin) {
      return res.status(401).json({ message: `Something went Wrong` });
    }
    if (admin.role != "Admin") {
      return res
        .status(401)
        .json({ message: `You did not have Authority to perform this task.` });
    }
    next();
  } catch (error) {
    console.log(error)
    return res.status(401).json({ message: `Authentication Expired`,error:error.message });
  }
};
