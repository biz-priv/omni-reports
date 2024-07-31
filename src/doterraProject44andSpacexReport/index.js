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
          if (s3KeyType === 'doterra') {
            return {
              shipment_id: row[0] || 'NULL',
              bol: row[1] || 'NULL',
              carrier_id: row[2] || 'NULL',
              container_id: row[3] || 'NULL',
              order_ref: row[4] || 'NULL',
            };
          } else if (s3KeyType === 'spacex') {
            return {
              tracking_number: row[0] || 'NULL',
              carrier_code: row[1] || 'NULL',
              voyage: row[2] || 'NULL',
              mawb_or_obl: row[3] || 'NULL',
              purchase_order: row[4] || 'NULL',
              part_number: row[5] || 'NULL',
              part_quantity: row[6] || 'NULL',
              incoterm: row[7] || 'NULL',
              supplier_reference: row[8] || 'NULL',
              transport_mode: row[9] || 'NULL',
              service_level: row[10] || 'NULL',
              pallets: row[11] || 'NULL',
              truck_consol_number: row[12] || 'NULL',
              shipper: row[13] || 'NULL',
              shipper_address: row[14] || 'NULL',
              shipper_city: row[15] || 'NULL',
              shipper_state: row[16] || 'NULL',
              shipper_country: row[17] || 'NULL',
              shipper_zip_code: row[18] || 'NULL',
              consignee: row[19] || 'NULL',
              consignee_address: row[20] || 'NULL',
              consignee_city: row[21] || 'NULL',
              consignee_state: row[22] || 'NULL',
              consignee_country: row[23] || 'NULL',
              consignee_zip_code: row[24] || 'NULL',
              hawb_tlb: row[25] || 'NULL',
              actual_weight_kg: row[26] || 'NULL',
              chargeable_weight_kg: row[27] || 'NULL',
              ocean_containers_qty: row[28] || 'NULL',
              ocean_types: row[29] || 'NULL',
              booking_date: row[30] || 'NULL',
              pickup_date: row[31] || 'NULL',
              atd: row[32] || 'NULL',
              customs_broker_turnover_date: row[33] || 'NULL',
              customs_release_date: row[34] || 'NULL',
              import_customs_release: row[35] || 'NULL',
              estimated_departure_date: row[36] || 'NULL',
              confirmed_departure_date: row[37] || 'NULL',
              out_for_delivery_date: row[38] || 'NULL',
              estimated_arrival_date: row[39] || 'NULL',
              ata: row[40] || 'NULL',
              pick_up_from_port_date: row[41] || 'NULL',
              arrival_at_transload_facility_date: row[42] || 'NULL',
              transload_to_truck_date: row[43] || 'NULL',
              departure_date_from_transload_facility: row[44] || 'NULL',
              delivery_date: row[45] || 'NULL',
              invoice_number: row[46] || 'NULL',
              invoice_date: row[47] || 'NULL',
              currency: row[48] || 'NULL',
              pre_carriage: row[49] || 'NULL',
              handling_at_origin: row[50] || 'NULL',
              handling_at_destination: row[51] || 'NULL',
              other_origin_charges: row[52] || 'NULL',
              customs_at_origin: row[53] || 'NULL',
              freight: row[54] || 'NULL',
              fuel: row[55] || 'NULL',
              dangerous_charges: row[56] || 'NULL',
              other_freight_related_surcharges: row[57] || 'NULL',
              customs_at_destination: row[58] || 'NULL',
              delivery: row[59] || 'NULL',
              documentation: row[60] || 'NULL',
              security: row[61] || 'NULL',
              demurrage_or_detention: row[62] || 'NULL',
              logistics: row[63] || 'NULL',
              insurance: row[64] || 'NULL',
              other_destination_charges: row[65] || 'NULL',
              others_unclassified: row[66] || 'NULL',
              taxes_and_duties: row[67] || 'NULL',
              amount_tax_excl: row[68] || 'NULL',
              consol_id: row[69] || 'NULL',
              comments: row[70] || 'NULL',
              pod_name: row[71] || 'NULL',
              exceptions_or_delay_information: row[72] || 'NULL',
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

  if (s3KeyType === 'doterra') {
    sender = process.env.OMNI_NO_REPLY_EMAIL;
    recipient = process.env.DOTERRA_RECIPIENTS;
    subject = `doTerra OCEAN ${process.env.STAGE} OMNI - ${formattedDate}`;
    bodyText = 'Hello,\n\nPlease see the attached Doterra file.\n\nBest regards.';
    filename = 'doterra.xlsx';
  } else if (s3KeyType === 'spacex') {
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

