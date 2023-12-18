const User = require("../models/User");

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

    user.password = undefined;
    // function to send otp in email
    sendData(res, 200, user, `${user.name} registered successfully`);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};
