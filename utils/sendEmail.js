const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });


const fs = require("fs");
const sg = require("@sendgrid/mail");
const api = process.env.SENDGRIP_API;
sg.setApiKey(api);
const PDFDocument = require("pdfkit");
const path = require("path");
const { format } = require("winston");

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
    const imagePath = path.join(__dirname, "/logo.png");
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(`${user._id}.pdf`);
    const formatDateTime = (dateTimeString) => {
      const dateTime = new Date(dateTimeString);
      const month = dateTime.toLocaleString("default", { month: "short" });
      const day = dateTime.getDate();
      const year = dateTime.getFullYear();
      const time = dateTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      return `${day} ${month}, ${year}`;
    };

    doc.font("Helvetica");

    doc.rect(50, 50, 500, 650).stroke();

    doc.image(imagePath, 330, 70, { width: 200, height: 60 });

    doc.fontSize(12).text("STRING ART PRIVATE LIMITED", 70, 150);
    doc.text("GSTIN - 37ABICS6540H1Z2", 70, 170);
    doc.text("Mobile - 7022022728", 70, 190);
    doc.text("Email - namaskaram@stringgeo.com", 70, 210);
    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(24).text("Tax Invoice", {
      align: "center",
    });

    let xColumn1 = 70;
    let yColumn1 = doc.y + 10;

    let xColumn2 = 300;
    let yColumn2 = doc.y + 10;

    doc.moveDown(4);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text("Billing To: Prakash", xColumn1, yColumn1, { lineGap: 5 })
      .text("Full Name: " + user.name, xColumn1, doc.y, { lineGap: 5 })
      .text("Email Id: " + user.email, xColumn1, doc.y, { lineGap: 5 })
      .text("Contact No: " + user.mobile, xColumn1, doc.y, { lineGap: 10 });

    doc
      .text(
        "Transaction Date: " + formatDateTime(transaction.createdAt),
        xColumn2,
        yColumn2,
        {
          align: "right",
          lineGap: 5,
        }
      )
      .text("Transaction No: " + transaction.payment_id, xColumn2, doc.y, {
        align: "right",
        lineGap: 10,
      });

    const tableMarginTop = 62;
    const borderWidth = 1;
    const cellPadding = 8;
    const columnWidths = [6, 3, 3, 3];

    const tableData = [
      ["Description", "SAC Code", "Amount (Rs.)"],
      [
        "Basic (Monthly)",
        "998433",
        parseFloat(0.82 * transaction.amount).toFixed(2),
      ],
      ["IGST @ 18%", "", parseFloat(0.18 * transaction.amount).toFixed(2)],
      ["Invoice Total", "", transaction.amount],
    ];

    const tableHeight = tableData.length * (borderWidth * 2 + cellPadding * 2);
    let tableTop = doc.y + tableMarginTop;
    doc.lineWidth(borderWidth);

    for (let i = 0; i < tableData.length; i++) {
      let rowTop = tableTop + i * (borderWidth * 2 + cellPadding * 2);
      for (let j = 0; j < tableData[i].length; j++) {
        let cellLeft = 70 + j * 150;
        let cellWidth = 150;
        doc
          .rect(cellLeft, rowTop, cellWidth, borderWidth * 2 + cellPadding * 2)
          .stroke();
        doc.text(
          tableData[i][j],
          cellLeft + cellPadding,
          rowTop + borderWidth + cellPadding
        );
      }
    }

    doc.moveDown(1);
    doc
      .fontSize(10)
      .text(
        "Note: The subscription amount is inclusive Goods and Service tax (GST) at rate of 18%.",
        70
      )
      .text("Reverse Charge Applicability: No", 70)
      .text("See Terms and Conditions on the www.stringgeo.com website", 70);

    doc.moveDown(4);

    doc
      .fontSize(12)
      .text("This is System generated invoice", { align: "center" })
      .moveDown(0.4)
      .text("STRING ART PRIVATE LIMITED", {
        align: "center",
        bold: true,
        marginBottom: 10,
      })
      .moveDown(0.4)
      .text("D NO 85-40-4/4, F S-1, SRI SARASWATHI NIVAS APPT,", {
        align: "center",
        marginBottom: 10,
      })
      .moveDown(0.4)
      .text("RAJAHMUNDRY, East Godavari,", {
        align: "center",
        marginBottom: 10,
      })
      .moveDown(0.4)
      .text("Andhra Pradesh, India, 533101", {
        align: "center",
        marginBottom: 10,
      });

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
                filename: `${user.name}.pdf`,
                path: `${user._id}.pdf`,
                encoding: "base64",
              },
            ],
          };

          try {
            await sg.send(msg);
            // console.log(data);
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

// exports.sendInvoice = async (user, transaction) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const formatDateTime = (dateTimeString) => {
//         const dateTime = new Date(dateTimeString);
//         const month = dateTime.toLocaleString("default", { month: "short" });
//         const day = dateTime.getDate();
//         const year = dateTime.getFullYear();
//         const time = dateTime.toLocaleTimeString("en-US", {
//           hour: "numeric",
//           minute: "numeric",
//           hour12: true,
//         });
//         return `${day} ${month}, ${year}`;
//       };

//       const htmlTemplate = `<div
//          style="padding:3rem; margin-bottom:3rem; border:1.5px solid black; margin-top: 7%; margin-left: 7%;margin-right: 7%;">
//          <div style="text-align: right;">
//            <img width="200px" height="60px" style="background-color: white; border: none;"
//              src="https://adelaide-car.s3.amazonaws.com/uploads/user-65e5b4c51dec04256212b52d/profile/1709807277309-String%20Geo%20logo%20Black.png" />
//          </div>
//          <div>
//            <p style="margin-bottom: 0.4rem;">
//              <strong>STRING ART PRIVATE LIMITED</strong>
//            </p>
//            <p style="margin-top: 0.4rem;margin-bottom: 0.4rem;">
//              <strong>GSTIN - </strong>37ABICS6540H1Z2
//            </p>
//            <p style="margin-top: 0.4rem;margin-bottom: 0.4rem;">
//              <strong>Mobile - </strong>7022022728
//            </p>
//            <p style="margin-top: 0.4rem;margin-bottom: 0.4rem;">
//              <strong>Email - </strong>namaskaram@stringgeo.com
//            </p>
//          </div>
//          <div style="text-align: center;">
//            <h1>Tax Invoice</h1>
//          </div>
//          <div style="display: flex;justify-content: space-between;">
//            <div style="display: flex;flex-direction: column;">
//              <p style="margin-bottom: 0.2rem;">Billing To: Prakash</p>
//              <p style="margin-bottom: 0.2rem;margin-top: 0.2rem;">Full Name: ${
//                 user.name
//               }</p>
//              <p style="margin-bottom: 0.2rem;margin-top: 0.2rem;">Email Id: ${
//                 user.email
//               }</p>
//              <p style="margin-top: 0.2rem;">Contact No: ${user.mobile}</p>
//            </div>
//            <div style="display: flex;flex-direction: column;">
//              <p style="margin-top: 0.2rem;margin-bottom: 0.2rem;" style="text-align: end;">Transaction Date: ${formatDateTime(
//                 transaction?.createdAt
//               )}</p>
//              <p style="margin-top: 0.2rem;">Transaction No: ${
//                 transaction.payment_id
//               }</p>
//            </div>
//          </div>
//          <div>
//            <table style="margin-top: 1rem; border-collapse: collapse; width: 100%; border: 3px solid black;">
//              <thead>
//                <tr>
//                  <th style="border: 2px solid black; padding: 8px;" colspan="6">Description</th>
//                  <th style="border: 2px solid black; padding: 8px;" colspan="3">SAC Code</th>
//                  <th style="border: 2px solid black; padding: 8px;" colspan="3">Amount (Rs.)</th>
//                </tr>
//              </thead>
//              <tbody>
//                <tr>
//                  <td style="border: 2px solid black; padding: 8px; text-align: center;" colspan="6">Basic
//                    (Monthly)</td>
//                  <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="3">998433</td>
//                  <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="3">${parseFloat(
//                     0.82 * transaction.amount
//                   ).toFixed(2)}</td>
//                </tr>
//                <tr>
//                  <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="6">IGST @ 18%
//                  </td>
//                  <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="3"></td>
//                  <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="3">${parseFloat(
//                     0.18 * transaction.amount
//                   ).toFixed(2)}</td>
//                </tr>
//                <tr>
//                  <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="6">Invoice Total
//                  </td>
//                  <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="3"></td>
//                  <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="3">${
//                     transaction.amount
//                   }</td>
//                </tr>

//              </tbody>
//            </table>
//          </div>

//          <div>
//            <p style="margin-bottom: 0.4rem;"><b>Note:</b> The subscription amount is inclusive Goods and Service tax
//              (GST) at rate of 18%.</p>
//            <p style="margin-top: 0.4rem;margin-bottom: 0.4rem;">Reverse Charge Applicability: No</p>
//            <p style="margin-top: 0.4rem;margin-bottom: 0.4rem;">See Terms and Conditions on the www.stringgeo.com
//              website</p>
//          </div>

//          <div style="margin-top: 4rem;text-align: center;">
//            <p>This is System generated invoice</p>
//            <p style="margin-bottom: 0.3rem;"><b>STRING ART PRIVATE LIMITED</b></p>
//            <p style="margin-bottom: 0.3rem;margin-top: 0.3rem;">D NO 85-40-4/4, F S-1, SRI SARASWATHI NIVAS APPT,</p>
//            <p style="margin-bottom: 0.3rem;margin-top: 0.3rem;">RAJAHMUNDRY, East Godavari,</p>
//            <p style="margin-bottom: 0.3rem;margin-top: 0.3rem;">Andhra Pradesh, India, 533101</p>

//          </div>

//        </div>`;

//       try {
//         const options = { format: "A4" };
//         const file = { content: htmlTemplate };
//         const pdfBuffer = await pdf.generatePdf(file, options);

//         const msg = {
//           to: user.email,
//           from: "namaskaram@stringgeo.com",
//           subject: "Sending an Invoice",
//           text: `Welcome ${user.name}, Thank you for joining us. Please find an attachment below containing your transaction details.`,
//           attachments: [
//             {
//               content: pdfBuffer.toString("base64"),
//               filename: `${user.name}.pdf`,
//               encoding: "base64",
//             },
//           ],
//         };

//         // Assuming sg.send(msg) is your email sending function
//         await sg.send(msg);

//         // Remove the cache directory
//         // fs.rmdirSync(path.join(__dirname, ".cache", `puppeteer`, `${user._id}`), { recursive: true });

//         resolve(pdfBuffer);
//       } catch (error) {
//         console.error("Error generating PDF:", error);
//         reject(error);
//       }
//     } catch (error) {
//       console.error("Error sending invoice:", error);
//       reject(error);
//     }
//   });
// };


