const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const PDFDocument = require("pdfkit");
dotenv.config({ path: "../config/config.env" });
const fs = require("fs")

exports.sendVerificationCode = async (email, code) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your Account Verification Code",
      html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

      <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #333333;">Account Verification Code</h1>
        <p style="color: #666666;">Your verification code is:</p>
        <p style="font-size: 24px; font-weight: bold; color: #009688; margin: 0;">${code}</p>
        <p style="color: #666666;">Use this code to verify your Account</p>
      </div>

      <div style="color: #888888;">
        <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team String Geo</span></p>
      </div>
    
    </div>`,
    };

    transporter.sendMail(mailOptions, (error, res) => {
      if (error) return console.log(error);
      return res;
    });
  } catch (error) {
    console.log(error);
  }
};

exports.sendForgotPasswordCode = async (name, email, code) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset Code",
      html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

      <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #333333;">Hey ${name}! You have requested Password Reset Code</h1>
        <p style="color: #666666;">Your Password Reset Code is:</p>
        <p style="font-size: 24px; font-weight: bold; color: #009688; margin: 0;">${code}</p>
        <p style="color: #666666;">
          If you did not request a password reset, please ignore this email or reply to let us know.
        </p>
      </div>

      <div style="color: #888888;">
        <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team String Geo</span></p>
      </div>
    
    </div>`,
    };

    transporter.sendMail(mailOptions, (error, res) => {
      if (error) return console.log(error);
      return res;
    });
  } catch (error) {
    console.log(error);
  }
};

exports.sendInvoice = async (user,transaction) => {
  return new Promise((resolve, reject) => {
  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(`${user._id}.pdf`);

  doc.text(`Name : ${user.name}\nEmail : ${user.email}\nTransaction Amount : ${transaction.amount}.\nTransaction id : ${transaction.razorpay_payment_id}`);
  
  doc.end();

  doc.pipe(writeStream);

  writeStream.on("finish", () => {
    fs.readFile(`${user._id}.pdf`, async (err, data) => {
      if (err) {
        console.log(err);
      } else {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
          },
        });
        
        const msg = {
          to: user.email,
          from: process.env.EMAIL,
          subject: "Sending an Invoice",
          text: `Welcome ${user.name}, Thankyou for join us. Please find an attachment below which contain your Transaction details.`,
          attachments: [
            {
              content: data.toString("base64"),
              filename: `${user._id}.pdf`,
              path: `${user._id}.pdf`,
              encoding: "base64",
            },
          ],
        };

        try {
          await transporter.sendMail(msg);
          console.log(data);
          fs.unlink(`${user._id}.pdf`, (err) => {});
          resolve(data);
        } catch (error) {
          console.log(error);
          reject(error);
        }
      }
    });
  });
})
};


