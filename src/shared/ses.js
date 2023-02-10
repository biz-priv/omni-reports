const aws = require('aws-sdk');
const nodemailer = require("nodemailer");

const ses = new aws.SES();

async function sendEmail(sesParams) {

  try {

    console.log("process.env.SMTP_HOST", process.env.SMTP_HOST);
    console.log("process.env.SMTP_PORT", process.env.SMTP_PORT);
    console.log("process.env.SMTP_USERNAME", process.env.SMTP_USERNAME);
    console.log("process.env.SMTP_PASSWORD", process.env.SMTP_PASSWORD);
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