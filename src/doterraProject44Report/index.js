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
const recipient = 'sreddy@bizcloudexperts.com, mohammed.sazeed@bizcloudexperts.com';
const subject = 'doTerra Reports - 3107';
const bodyText = 'Hello,\n\nPlease see the attached file.\n\nBest regards.';

let s3KeyType;
module.exports.handler = async (event, context) => {
  console.info('Event Received:', JSON.stringify(event));
  try {
    const s3Bucket = get(event, 'Records[0].s3.bucket.name', '');
    const s3Key = get(event, 'Records[0].s3.object.key', '');

    console.log(`S3 Bucket: ${s3Bucket}, S3 Key: ${s3Key}`);

    s3KeyType = get(s3Key.split('/'), '[0]', '')

    const csvData = await getS3Data(s3Bucket, s3Key);
    console.log('CSV Data retrieved successfully');

    const processedData = await processCSV(csvData);
    console.log('CSV Data processed successfully');

    const attachmentBuffer = createExcelBuffer(processedData);
    console.log('Excel buffer created successfully');

    await sendEmail(attachmentBuffer);
    console.log('Email sent successfully');

    return 'Success';
  } catch (error) {
    console.error('Main lambda error: ', error);
    return 'Failed';
  }
};

async function getS3Data(bucket, key) {
  const params = { Bucket: bucket, Key: key };
  console.log('Getting S3 data with params:', params);
  try {
    const response = await s3.getObject(params).promise();
    console.log('S3 data retrieval successful');
    return response.Body.toString();
  } catch (error) {
    console.error('Read S3 data: ', error, '\nS3 params: ', params);
    throw error;
  }
}

const stream = require('stream');
const csv = require('csv-parser');

function processCSV(csvData, s3KeyType) {
  console.log('Processing CSV data');
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(csvData));

    const headers =
      s3KeyType === 'doterra'
        ? ['shipment_id', 'bol', 'carrier_id', 'container_id', 'order_ref']
        : [
            'Tracking Number',
            'Carrier Code',
            'Voyage#',
            'MAWB OR OBL',
            'Purchase Order',
            'Part Number',
            'Part Quantity',
            'Incoterm',
            'Supplier Reference',
            'Transport Mode',
            'Service Level',
            '# of Pallets',
            'Truck Consol #',
            'Shipper',
            'Shipper Address',
            'Shipper City',
            'Shipper State',
            'Shipper Country',
            'Shipper Zip Code',
            'Consignee',
            'Consignee Address',
            'Consignee City',
            'Consignee State',
            'Consignee Country',
            'Consignee Zip Code',
            'HAWB/TBL',
            'Actual Weight (kg)',
            'Chargeable Weight (kg)',
            'Ocean Container(s) Qty',
            'Ocean Type(s)',
            'Booking Date',
            'Pickup Date',
            'ATD',
            'Customs Broker Turnover Date',
            'Customs Release Date',
            'Import Customs Release',
            'Estimated Departure Date',
            'Confirmed Departure / COB Date',
            'Out for Delivery Date',
            'Estimated Arrival Date',
            'ATA',
            'Pick up from Port date',
            'Arrival at Transload Facility Date',
            'Transload to Truck Date',
            'Departure date from Transload facility',
            'Delivery Date',
            'Invoice Number',
            'Invoice Date',
            'Currency',
            'Pre-Carriage',
            'Handling at Origin',
            'Handling at Destination',
            'Other Origin Charges',
            'Customs at Origin',
            'Freight',
            'Fuel',
            'Dangerous Charges',
            'Other Freight Related Surcharges',
            'Customs at Destination',
            'Delivery',
            'Documentation',
            'Security',
            'Demurrage / Detention',
            'LOGISTICS',
            'Insurance',
            'Other Destination Charges',
            'Others Unclassified',
            'Taxes & Duties',
            'Amount Tax Excl (in invoice currency)',
            'consolID',
            'Comments',
            'POD Nam',
            'Exceptions / Delay Information',
          ];

    bufferStream
      .pipe(csv({ headers }))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        const processedData = results.map((row) => {
          if (s3KeyType === 'doterra') {
            return {
              shipment_id: row.shipment_id || 'NULL',
              bol: row.bol || 'NULL',
              carrier_id: row.carrier_id || 'NULL',
              container_id: row.container_id || 'NULL',
              order_ref: row.order_ref || 'NULL',
            };
          } else {
            return row;
          }
        });
        console.log('CSV processing complete');
        resolve(processedData);
      })
      .on('error', (error) => {
        console.error('Error processing CSV data:', error);
        reject(error);
      });
  });
}


function createExcelBuffer(data) {
  console.log('Creating Excel buffer');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  console.log('Excel buffer created');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function sendEmail(attachmentBuffer) {
  console.log('Sending email');
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

// async function uploadFileToS3(filename, csv) {
//   console.log("uploadFileToS3")
//   try {
//     const params = {
//       Bucket: process.env.S3_BUCKET_NAME,
//       Key: `doterra/archieve/${filename}`,
//       Body: csv,
//       ContentType: "application/octet-stream",
//     };
//     await s3.putObject(params).promise();
//   } catch (error) {
//     console.log("error", error);
//   }
// }
