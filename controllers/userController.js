const User = require("../models/User");
const { generateCode } = require("../utils/generateCode");
const { sendVerificationCode } = require("../utils/sendEmail");

const sendData = (res, statusCode, user, message) => {
  const token = user.getJWTToken();

  res.status(statusCode).json({
    success: true,
    user,
    token,
    message,
  });
};

exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      mobile,
      states,
      district,
      city,
    } = req.body;
    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !mobile ||
      !states ||
      !district ||
      !city
    ) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be atleast 8 characters long" });
    if (mobile.length !== 10)
      return res
        .status(400)
        .json({ message: "Please enter valid mobile number" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    let user = await User.findOne({ email });
    let user2 = await User.findOne({ mobile });
    if (user)
      return res
        .status(400)
        .json({ message: "User already exists with this Email" });
    if (user2)
      return res.status(400).json({ message: "Mobile number already exists" });

    user = await User.create({
      name,
      email,
      password,
      mobile,
      states,
      district,
      city,
    });

    const code = generateCode();
    await sendVerificationCode(user.email, code);

    user.temp_code = code;
    await user.save();

    user.password = undefined;
    return res.status(200).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.verifyAccount = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ message: "Please enter all fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User does not exist" });

    if (user.temp_code !== code)
      return res.status(400).json({ message: "Invalid/Expired code" });

    user.is_verified = true;
    user.temp_code = "";
    await user.save();

    sendData(res, 200, user, `Account Verified successfully`);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
