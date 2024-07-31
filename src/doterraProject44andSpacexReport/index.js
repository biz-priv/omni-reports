/*
* File: src\doterraProject44andSpacexReport\index.js
* Project: Omni-reports
* Author: Bizcloud Experts
* Date: 2024-08-01
* Confidential and Proprietary
*/

'use strict';

const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');
const { get } = require('lodash');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const stream = require('stream');

const s3 = new AWS.S3();
const ses = new AWS.SES({ apiVersion: '2010-12-01' });
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });

const transporter = nodemailer.createTransport({
  SES: ses
});

let s3KeyType;

module.exports.handler = async (event, context) => {
  console.info('Event Received:', JSON.stringify(event));
  try {
    const s3Bucket = get(event, 'Records[0].s3.bucket.name', '');
    const s3Key = get(event, 'Records[0].s3.object.key', '');

    console.info(`S3 Bucket: ${s3Bucket}, S3 Key: ${s3Key}`);

    const csvData = await getS3Data(s3Bucket, s3Key);

    s3KeyType = get(s3Key.split('/'), '[0]', '');

    const processedData = await processCSV(csvData,s3KeyType);

    const attachmentBuffer = createExcelBuffer(processedData);

    await sendEmail(attachmentBuffer,s3KeyType);
    console.info('Email sent successfully');

    return 'Success';
  } catch (error) {
    console.error('Main lambda error: ', error);
    const params = {
      Message: `An error occurred in function ${context.functionName}. Error details: ${error}.`,
      Subject: `Lambda function ${context.functionName} have failed.`,
      TopicArn: process.env.ERROR_SNS_TOPIC_ARN,
    };
    await sns.publish(params).promise();
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

function processCSV(csvData, s3KeyType) {
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(csvData));

    bufferStream
      .pipe(csv({ headers: false }))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        const processedData = results.map((row) => {
          if (s3KeyType === 'doterra_' + process.env.STAGE) {
            return {
              shipment_id: get(row,'[0]') ?? 'NULL',
              bol: get(row,'[1]') ?? 'NULL',
              carrier_id: get(row,'[2]') ?? 'NULL',
              container_id: get(row,'[3]') ?? 'NULL',
              order_ref: get(row,'[4]') ?? 'NULL',
            };
          } else if (s3KeyType === 'spacex_' + process.env.STAGE) {
            return {
              'Tracking Number': get(row,'[0]') ?? 'NULL',
              'Carrier Code': get(row,'[1]') ?? 'NULL',
              'Voyage#': get(row,'[2]') ?? 'NULL',
              'MAWB OR OBL': get(row,'[3]') ?? 'NULL',
              'Purchase Order': get(row,'[4]') ?? 'NULL',
              'Part Number': get(row,'[5]') ?? 'NULL',
              'Part Quantity': get(row,'[6]') ?? 'NULL',
              'Incoterm': get(row,'[7]') ?? 'NULL',
              'Supplier Reference': get(row,'[8]') ?? 'NULL',
              'Transport Mode': get(row,'[9]') ?? 'NULL',
              'Service Level': get(row,'[10]') ?? 'NULL',
              '# of Pallets': get(row,'[11]') ?? 'NULL',
              'Truck Consol #': get(row,'[12]') ?? 'NULL',
              'Shipper': get(row,'[13]') ?? 'NULL',
              'Shipper Address': get(row,'[14]') ?? 'NULL',
              'Shipper City': get(row,'[15]') ?? 'NULL',
              'Shipper State': get(row,'[16]') ?? 'NULL',
              'Shipper Country': get(row,'[17]') ?? 'NULL',
              'Shipper Zip Code': get(row,'[18]') ?? 'NULL',
              'Consignee': get(row,'[19]') ?? 'NULL',
              'Consignee Address': get(row,'[20]') ?? 'NULL',
              'Consignee City': get(row,'[21]') ?? 'NULL',
              'Consignee State': get(row,'[22]') ?? 'NULL',
              'Consignee Country': get(row,'[23]') ?? 'NULL',
              'Consignee Zip Code': get(row,'[24]') ?? 'NULL',
              'HAWB/TBL': get(row,'[25]') ?? 'NULL',
              'Actual Weight (kg)': get(row,'[26]') ?? 'NULL',
              'Chargeable Weight (kg)': get(row,'[27]') ?? 'NULL',
              'Ocean Container(s) Qty': get(row,'[28]') ?? 'NULL',
              'Ocean Type(s)': get(row,'[29]') ?? 'NULL',
              'Booking Date': get(row,'[30]') ?? 'NULL',
              'Pickup Date': get(row,'[31]') ?? 'NULL',
              'ATD': get(row,'[32]') ?? 'NULL',
              'Customs Broker Turnover Date': get(row,'[33]') ?? 'NULL',
              'Customs Release Date': get(row,'[34]') ?? 'NULL',
              'Import Customs Release': get(row,'[35]') ?? 'NULL',
              'Estimated Departure Date': get(row,'[36]') ?? 'NULL',
              'Confirmed Departure / COB Date': get(row,'[37]') ?? 'NULL',
              'Out for Delivery Date': get(row,'[38]') ?? 'NULL',
              'Estimated Arrival Date':get(row,'[39]') ?? 'NULL',
              'ATA': get(row,'[40]') ?? 'NULL',
              'Pick up from Port date': get(row,'[41]') ?? 'NULL',
              'Arrival at Transload Facility Date': get(row,'[42]') ?? 'NULL',
              'Transload to Truck Date': get(row,'[43]') ?? 'NULL',
              'Departure date from Transload facility': get(row,'[44]') ?? 'NULL',
              'Delivery Date': get(row,'[45]') ?? 'NULL',
              'Invoice Number': get(row,'[46]') ?? 'NULL',
              'Invoice Date': get(row,'[47]') ?? 'NULL',
              'Currency': get(row,'[48]') ?? 'NULL',
              'Pre-Carriage': get(row,'[49]') ?? 'NULL',
              'Handling at Origin': get(row,'[50]') ?? 'NULL',
              'Handling at Destination':get(row,'[51]') ?? 'NULL',
              'Other Origin Charges': get(row,'[52]') ?? 'NULL',
              'Customs at Origin': get(row,'[53]') ?? 'NULL',
              'Freight': get(row,'[54]') ?? 'NULL',
              'Fuel': get(row,'[55]') ?? 'NULL',
              'Dangerous Charges': get(row,'[56]') ?? 'NULL',
              'Other Freight Related Surcharges': get(row,'[57]') ?? 'NULL',
              'Customs at Destination': get(row,'[58]') ?? 'NULL',
              'Delivery': get(row,'[59]') ?? 'NULL',
              'Documentation': get(row,'[60]') ?? 'NULL',
              'Security': get(row,'[61]') ?? 'NULL',
              'Demurrage / Detention': get(row,'[62]') ?? 'NULL',
              'LOGISTICS': get(row,'[63]') ?? 'NULL',
              'Insurance': get(row,'[64]') ?? 'NULL',
              'Other Destination Charges': get(row,'[65]') ?? 'NULL',
              'Others Unclassified': get(row,'[66]') ?? 'NULL',
              'Taxes & Duties': get(row,'[67]') ?? 'NULL',
              'Amount Tax Excl (in invoice currency)': get(row,'[68]') ?? 'NULL',
              'consolID': get(row,'[69]') ?? 'NULL',
              'Comments': get(row,'[70]') ?? 'NULL',
              'POD Name': get(row,'[71]') ?? 'NULL',
              'Exceptions / Delay Information': get(row,'[72]') ?? 'NULL',
            };
          }
        });

        resolve(processedData);
      })
      .on('error', (error) => {
        console.error('Error processing CSV data:', error);
        reject(error);
      });
  });
}


function createExcelBuffer(data) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  console.info('Excel buffer created');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function sendEmail(attachmentBuffer, s3KeyType) {

  let sender;
  let recipient;
  let subject;
  let bodyText;
  let filename;

  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().replace('T', ' ').slice(0, 19);

  if (s3KeyType === 'doterra_' + process.env.STAGE) {
    sender = process.env.OMNI_NO_REPLY_EMAIL;
    recipient = process.env.DOTERRA_RECIPIENTS;
    subject = `doTerra OCEAN ${process.env.STAGE} OMNI - ${formattedDate}`;
    bodyText = 'Hello,\n\nPlease see the attached Doterra file.\n\nBest regards.';
    filename = 'doterra.xlsx';
  } else if (s3KeyType === 'spacex_' + process.env.STAGE) {
    sender = process.env.OMNI_NO_REPLY_EMAIL;
    recipient = process.env.SPACEX_RECIPIENTS;
    subject = `SpaceX Reports ${process.env.STAGE} - ${formattedDate}`;
    bodyText = 'Hello,\n\nPlease see the attached SpaceX file.\n\nBest regards.';
    filename = 'spacex.xlsx';
  }

  const mailOptions = {
    from: sender,
    to: recipient,
    subject,
    text: bodyText,
    attachments: [
      {
        filename,
        content: attachmentBuffer,
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.info('Email sent! Message ID:', info.messageId);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

