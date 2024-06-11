/*
* File: src\shared\ses.js
* Project: Omni-reports
* Author: Bizcloud Experts
* Date: 2023-02-10
* Confidential and Proprietary
*/
const nodemailer = require("nodemailer");

async function sendEmail(sesParams) {

  try {
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USERNAME, 
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail(sesParams);

    console.info("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error while sending an email", error);
    return false;
  }
}

module.exports = { sendEmail };