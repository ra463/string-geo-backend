const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const PDFDocument = require("pdfkit");
const pdf = require("html-pdf");
dotenv.config({ path: "../config/config.env" });
const fs = require("fs");
const sg = require("@sendgrid/mail");
const api = process.env.SENDGRIP_API;
sg.setApiKey(api);


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
  return sg.send({
    to: emails,
    from: "namaskaram@stringgeo.com",
    subject: `${subject}`,
    text: `${description}`,
  });
};

exports.sendInvoice2 = async (user, transaction) => {
  return new Promise((resolve, reject) => {
    const htmlTemplate = `<div
    style="padding:3rem; margin-bottom:3rem; border:1.5px solid black; margin-top: 7%; margin-left: 7%;margin-right: 7%;">
    <div style="text-align: right;">
      <img width="200px" height="60px" style="background-color: white; border: none;"
        src="https://stringgeo.com/upload/NewFolder/String%20Geo%20logo%20Icon.png" />
    </div>
    <div>
      <p style="margin-bottom: 0.4rem;">
        <strong>STRING ART PRIVATE LIMITED</strong>
      </p>
      <p style="margin-top: 0.4rem;margin-bottom: 0.4rem;">
        <strong>GSTIN - </strong>37ABICS6540H1Z2
      </p>
      <p style="margin-top: 0.4rem;margin-bottom: 0.4rem;">
        <strong>Mobile - </strong>7022022728
      </p>
      <p style="margin-top: 0.4rem;margin-bottom: 0.4rem;">
        <strong>Email - </strong>namaskaram@stringgeo.com
      </p>
    </div>
    <div style="text-align: center;">
      <h1>Tax Invoice</h1>
    </div>
    <div style="display: flex;justify-content: space-between;">
      <div style="display: flex;flex-direction: column;">
        <p style="margin-bottom: 0.2rem;">Billing To:Prakash</p>
        <p style="margin-bottom: 0.2rem;margin-top: 0.2rem;">Full Name: ${user.name}</p>
        <p style="margin-bottom: 0.2rem;margin-top: 0.2rem;">Email Id:banukash1@gmail.com</p>
        <p style="margin-top: 0.2rem;">Contact No: ${user.mobile}</p>
        <!-- <p>Address:</p> -->
      </div>
      <div style="display: flex;flex-direction: column;">
        <p style="margin-top: 0.2rem;margin-bottom: 0.2rem;" style="text-align: end;">Invoice Date: 07 Dec
          202316</p>
        <p style="margin-top: 0.2rem;">Invoice No: SG-2023-2024-1856</p>
      </div>
    </div>
    <div>
      <table style="margin-top: 1rem; border-collapse: collapse; width: 100%; border: 3px solid black;">
        <thead>
          <tr>
            <th style="border: 2px solid black; padding: 8px;" colspan="6">Description</th>
            <th style="border: 2px solid black; padding: 8px;" colspan="3">SAC Code</th>
            <th style="border: 2px solid black; padding: 8px;" colspan="3">Amount (Rs.)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 2px solid black; padding: 8px; text-align: center;" colspan="6">Basic
              (Monthly)</td>
            <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="3">998433</td>
            <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="3">84</td>
          </tr>
          <tr>
            <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="6">IGST @ 18%
            </td>
            <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="3"></td>
            <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="3">15</td>
          </tr>
          <tr>
            <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="6">Invoice Total
            </td>
            <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="3"></td>
            <td style="border: 2px solid black; padding: 8px;text-align: center;" colspan="3">90</td>
          </tr>

        </tbody>
      </table>
    </div>

    <div>
      <p style="margin-bottom: 0.4rem;"><b>Note:</b> The subscription amount is inclusive Goods and Service tax
        (GST) at rate of 18%.</p>
      <p style="margin-top: 0.4rem;margin-bottom: 0.4rem;">Reverse Charge Applicability: No</p>
      <p style="margin-top: 0.4rem;margin-bottom: 0.4rem;">See Terms and Conditions on the www.stringgeo.com
        website</p>
    </div>

    <div style="margin-top: 4rem;text-align: center;">
      <p>This is System generated invoice</p>
      <p style="margin-bottom: 0.3rem;"><b>STRING ART PRIVATE LIMITED</b></p>
      <p style="margin-bottom: 0.3rem;margin-top: 0.3rem;">D NO 85-40-4/4, F S-1, SRI SARASWATHI NIVAS APPT,</p>
      <p style="margin-bottom: 0.3rem;margin-top: 0.3rem;">RAJAHMUNDRY, East Godavari,</p>
      <p style="margin-bottom: 0.3rem;margin-top: 0.3rem;">Andhra Pradesh, India, 533101</p>

    </div>

  </div>`;

    const pdfOptions = {
      format: "Letter",
    };

    pdf
      .create(htmlTemplate, pdfOptions)
      .toFile(`${user._id}.pdf`, async function (err, res) {
        if (err) return reject(err);

        fs.readFile(`${user._id}.pdf`, async (err, data) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            const msg = {
              to: user.email,
              from: "namaskaram@stringgeo.com",
              subject: "Sending an Invoice",
              text: `Welcome ${user.name}, Thank you for joining us. Please find an attachment below containing your transaction details.`,
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


