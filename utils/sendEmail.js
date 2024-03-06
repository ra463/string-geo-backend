const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const PDFDocument = require("pdfkit");
const pdf = require("html-pdf");
dotenv.config({ path: "../config/config.env" });
const fs = require("fs");
const sg = require("@sendgrid/mail");
const api = process.env.SENDGRIP_API;
sg.setApiKey(api);
const jsreport = require("jsreport-core");

exports.sendVerificationCode = async (email, code) => {
  try {
    const mailOptions = {
      from: "namaskaram@stringgeo.com",
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
    await sg.send(mailOptions);
  } catch (error) {
    console.log(error);
  }
};

exports.sendForgotPasswordCode = async (name, email, code) => {
  try {
    const mailOptions = {
      from: "namaskaram@stringgeo.com",
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
    await sg.send(mailOptions);
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
          const msg = {
            to: user.email,
            from: "namaskaram@stringgeo.com",
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
            await sg.send(msg);
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

exports.sendBulkEmail = async (emails, subject, description) => {
  return sg.sendMultiple({
    to: emails,
    from: "namaskaram@stringgeo.com",
    subject: `${subject}`,
    text: `${description}`,
  });
};

// exports.sendInvoice2 = async (user, transaction) => {
//   return new Promise((resolve, reject) => {
//     const htmlTemplate = `<div
//     style="padding:3rem; margin-bottom:3rem; border:1.5px solid black; margin-top: 7%; margin-left: 7%;margin-right: 7%;">
//     <div style="text-align: right;">
//       <img width="200px" height="60px" style="background-color: white; border: none;"
//         src="https://stringgeo.com/upload/NewFolder/String%20Geo%20logo%20Icon.png" />
//     </div>
    
   
//   </div>`;

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
//             const msg = {
//               to: user.email,
//               from: "namaskaram@stringgeo.com",
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
//               await sg.send(msg);
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

exports.sendInvoice2 = async (user, transaction) => {
  return new Promise(async (resolve, reject) => {
    const htmlTemplate = `<div
    style="padding:3rem; margin-bottom:3rem; border:1.5px solid black; margin-top: 7%; margin-left: 7%;margin-right: 7%;">
    <div style="text-align: right;">
      <img width="200px" height="60px" style="background-color: white; border: none;"
        src="https://stringgeo.com/upload/NewFolder/String%20Geo%20logo%20Icon.png" />
    </div>
  </div>`;

    const jsreportInstance = jsreport({
      tasks: {
        allowedModules: "*",
      },
      logger: {
        silent: true,
      },
    });

    await jsreportInstance.init();

    try {
      // Render the HTML template to PDF
      const pdfBuffer = await jsreportInstance.render({
        template: {
          content: htmlTemplate,
          engine: "handlebars",
          recipe: "chrome-pdf",
        },
      });

      // Write the PDF buffer to a file
      fs.writeFileSync(`${user._id}.pdf`, pdfBuffer);

      const msg = {
        to: user.email,
        from: "namaskaram@stringgeo.com",
        subject: "Sending an Invoice",
        text: `Welcome ${user.name}, Thank you for joining us. Please find an attachment below containing your transaction details.`,
        attachments: [
          {
            content: pdfBuffer,
            filename: `${user._id}.pdf`,
            path: `${user._id}.pdf`,
            encoding: "base64",
          },
        ],
      };

      await sg.send(msg);

      // Perform actions with the PDF file (send email, etc.)
      // For simplicity, let's assume we just log its content here
      // console.log(pdfBuffer.toString("base64"));

      // Clean up - Remove the PDF file
      fs.unlinkSync(`${user._id}.pdf`);

      resolve(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      reject(error);
    }
  });
};
