'use strict';

const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');
const { get } = require('lodash');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const stream = require('stream');

const s3 = new AWS.S3();
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

const transporter = nodemailer.createTransport({
  SES: ses
});

const sender = 'no-reply@omnilogistics.com';
const recipient = 'sreddy@bizcloudexperts.com, mohammed.sazeed@bizcloudexperts.com, sunilkunapareddys@gmail.com, mohammedsazeed2@gmail.com';
const subject = 'doTerra Reports - 3107';
const bodyText = 'Hello,\n\nPlease see the attached file.\n\nBest regards.';

module.exports.handler = async (event, context) => {
  console.info(JSON.stringify(event));
  try {
    const s3Bucket = get(event, 'Records[0].s3.bucket.name', '');
    const s3Key = get(event, 'Records[0].s3.object.key', '');

    const csvData = await getS3Data(s3Bucket, s3Key);
    const processedData = await processCSV(csvData);

    const attachmentBuffer = createExcelBuffer(processedData);
    await sendEmail(attachmentBuffer);

    return 'Success';
  } catch (error) {
    console.error('Main lambda error: ', error);
    return 'Failed';
  }
};

async function getS3Data(bucket, key) {
  const params = { Bucket: bucket, Key: key };
  try {
    const response = await s3.getObject(params).promise();
    return response.Body.toString();
  } catch (error) {
    console.error('Read S3 data: ', error, '\nS3 params: ', params);
    throw error;
  }
}

function processCSV(csvData) {
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(csvData));

    bufferStream
      .pipe(csv({ headers: false }))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        const processedData = results.map(row => ({
          shipment_id: row[0] || 'NULL',
          bol: row[1] || 'NULL',
          carrier_id: row[2] || 'NULL',
          container_id: row[3] || 'NULL',
          order_ref: row[4] || 'NULL',
        }));
        resolve(processedData);
      })
      .on('error', (error) => reject(error));
  });
}

function createExcelBuffer(data) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function sendEmail(attachmentBuffer) {
  const mailOptions = {
    from: sender,
    to: recipient,
    subject,
    text: bodyText,
    attachments: [
      {
        filename: 'doTerra_reports_3107.xlsx',
        content: attachmentBuffer
      }
    ]
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
    } else {
      console.info('Email sent! Message ID:', info.messageId);
    }
  });
}
