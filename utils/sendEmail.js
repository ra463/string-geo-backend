const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const PDFDocument = require("pdfkit");
const pdf = require("html-pdf");
dotenv.config({ path: "../config/config.env" });
const fs = require("fs");

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
          If you did not request a password reset, please ignore this email.
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

exports.sendInvoice = async (user, transaction) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(`${user._id}.pdf`);

    doc.text(
      `Name : ${user.name}\nEmail : ${user.email}\nTransaction Amount : ${transaction.amount}.\nTransaction id : ${transaction.payment_id}`
    );

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
            html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

                <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                  <h1 style="color: #333333;">Hey ${user.name}! You Payment of ${transaction.amount} has been done successfully</h1>
                  <p style="color: #666666;">You have now access to our paid content.</p>
                  <p style="color: #666666;">
                    If you did not request this mail, please ignore this email.
                  </p>
                </div>

                <div style="color: #888888;">
                  <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team String Geo</span></p>
                </div>
    
              </div>`,
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
  });
};

// exports.sendInvoice = async (user, transaction) => {
//   return new Promise((resolve, reject) => {
//     const htmlTemplate = `
//     <html>
// <head>
// <style>
// body {
//   font-family: Arial, sans-serif;
//   margin: 40px; /* Increase margin due to border */
//   color: #fff;
//   background-color: #1e1e1e; /* Dark background color */
//   border: 10px solid #caa257; /* Border color */
//   padding: 20px; /* Add padding to separate content from border */
//   position: relative; /* Make the body a relative positioning context */
//   min-height: 100vh; /* Ensure the body takes up at least the full viewport height */
// }
// .header {
//   margin-bottom: 20px;
//   overflow: hidden; /* Clear floats */
// }
// .header img {
//   float: left; /* Float the image to the left */
//   border-radius: 50%;
//   border: 3px solid #caa257; /* Border color */
//   margin-right: 20px; /* Add margin to separate from text */
// }
// h1, h2 {
//   color: #caa257; /* Header text color */
//   margin: 0; /* Remove default margin */
// }
// table {
//   width: 100%;
//   border-collapse: collapse;
//   margin-top: 20px;
// }
// th, td {
//   border: 1px solid #ffffff; /* White border color */
//   padding: 8px;
//   text-align: left;
// }
// th {
//   background-color: #caa257; /* Header background color */
// }
// .footer {
//   position: absolute;
//   bottom: 20px; /* Add margin to separate from border */
//   left: 20px; /* Add margin to separate from border */
//   right: 20px; /* Add margin to separate from border */
//   width: 95%; /* Adjust the width to account for left and right margin */
//   background-color: #caa257; /* Footer background color */
//   padding: 10px;
//   text-align: center;
// }
// </style>

// </head>
// <body>
//   <div class="header">
//     <img src="https://stringgeo.com/upload/NewFolder/String%20Geo%20logo%20Icon.png" alt="String Geo Logo" width="100" height="100">
//     <h1>String Geo</h1>
//     <h2>Invoice</h2>
//   </div>
//   <div class="header">
//     <h2>User Information:</h2>
//     <p>Name: ${user.name}</p>
//     <p>Email: ${user.email}</p>
//   </div>
//   <h2>Transaction Details:</h2>
//   <table>
//     <tr>
//       <th>Transaction Attribute</th>
//       <th>Value</th>
//     </tr>
//     <tr>
//       <td>Transaction Amount</td>
//       <td>₹ ${transaction.amount/100}</td>
//     </tr>
//     <tr>
//       <td>Transaction ID</td>
//       <td>${transaction.razorpay_payment_id}</td>
//     </tr>
//   </table>
//   <div class="footer">
//     Thank you for your business!
//   </div>
// </body>
// </html>
//     `;

//     const pdfOptions = {
//       format: "Letter",
//     };

//     pdf
//       .create(htmlTemplate, pdfOptions)
//       .toFile(`${user._id}.pdf`, async function (err, res) {
//         if (err) return reject(err);

//         fs.readFile(`${user._id}.pdf`, async (err, data) => {
//           if (err) {
//             console.log(err);
//             reject(err);
//           } else {
//             const transporter = nodemailer.createTransport({
//               service: "gmail",
//               auth: {
//                 user: process.env.EMAIL,
//                 pass: process.env.PASSWORD,
//               },
//             });

//             const msg = {
//               to: user.email,
//               from: process.env.EMAIL,
//               subject: "Sending an Invoice",
//               text: `Welcome ${user.name}, Thank you for joining us. Please find an attachment below containing your transaction details.`,
//               attachments: [
//                 {
//                   content: data.toString("base64"),
//                   filename: `${user._id}.pdf`,
//                   path: `${user._id}.pdf`,
//                   encoding: "base64",
//                 },
//               ],
//             };

//             try {
//               await transporter.sendMail(msg);

//               fs.unlink(`${user._id}.pdf`, (err) => {});
//               resolve(data);
//             } catch (error) {
//               console.log(error);
//               reject(error);
//             }
//           }
//         });
//       });
//   });
// };
