// 'use strict'

const AWS = require('aws-sdk');
// const fs = require('fs');
const nodemailer = require('nodemailer');
// Create SES transporter
const ses = new AWS.SES({ apiVersion: '2010-12-01' });
const transporter = nodemailer.createTransport({
  SES: ses
});

// Define email parameters
const sender = 'no-reply@omnilogistics.com';
const recipient = 'sreddy@bizcloudexperts.com, mohammed.sazeed@bizcloudexperts.com, sunilkunapareddys@gmail.com, mohammedsazeed2@gmail.com';
const subject = 'doTerra Reports - 3107';
const bodyText = 'Hello,\n\nPlease see the attached file.\n\nBest regards.';
const attachmentFilePath = '/Users/mohammedsazeed/Downloads/doterra-2.xlsx';


module.exports.handler = async (event, context) => {
  console.info(JSON.stringify(event));
  try {
      const s3Bucket = get(event, 'Records[0].s3.bucket.name', '');
      const s3Key = get(event, 'Records[0].s3.object.key', '');
      console.log("s3Key",s3Key);
      const s3Data = await getS3Data(s3Bucket, s3Key);

      console.log("s3Data",s3Data);

    return 'Success';
  } catch (error) {
    console.error('Main lambda error: ', error);
    await putItem(dynamoData);
    return 'Failed';
  }
};

async function getS3Data(bucket, key) {
  let params;
  try {
    params = { Bucket: bucket, Key: key };
    const response = await s3.getObject(params).promise();
    return response.Body.toString();
  } catch (error) {
    console.error('Read s3 data: ', error, '\ns3 params: ', params);
    throw error;
  }
}
// Read the attachment
// const attachment = fs.readFileSync(attachmentFilePath);
console.info('🚀 ~ file: test.js:23 ~ attachment:', attachment)

// Create the email options
const mailOptions = {
  from: sender,
  to: recipient,
  subject,
  text: bodyText,
  attachments: [
    {
      filename: 'doTerra_reports_3107.xlsx',
      content: attachment
    }
  ]
};

// Send the email
transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.error('Error sending email:', err);
  } else {
    console.info('Email sent! Message ID:', info.messageId);
  }
});