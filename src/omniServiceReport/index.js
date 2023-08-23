const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const { Client } = require('pg');
const Excel = require('exceljs');
const { omniWeeklyServiceReportSqlQuery } = require("../shared/query/omniWeeklyServiceReportSqlQuery");
const { sendEmail } = require('../shared/ses');
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
module.exports.handler = async () => {
  try {
    await fetchDataFromRedshift();
  } catch (err) {
    console.log("handler:error", err);
    const params = {
      Message: `An error occurred in function ${process.env.FUNCTION_NAME}. Error details: ${err}.`,
      Subject: `Lambda function ${process.env.FUNCTION_NAME} have failed.`,
      TopicArn: process.env.ERROR_SNS_ARN,
    };
    await sns.publish(params).promise();
  }
  console.log("end of the code");
};

async function fetchDataFromRedshift() {

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  try {
    await client.connect();

    const { rows } = await client.query(omniWeeklyServiceReportSqlQuery);
    await client.end();
    const timestamp = new Date()
    const filename = "WeeklyServiceReport_" + timestamp.toISOString().substring(5, 10) + '-' + timestamp.toISOString().substring(0, 4) +  ".xlsx";
    const workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet('Sheet1');

    let fields = [
      { header: 'Actual Departure Date - Y-M-D', key: 'actualdepartdate' },
      { header: 'House Ref', key: 'houseref' },
      { header: 'Consignor Name', key: 'consignorname' },
      { header: 'Consignee Name', key: 'consigneename' },
      { header: 'Consignee City', key: 'consigneecity' },
      { header: 'Cosignee State', key: 'cosigneestate' },
      { header: 'Consignee Zip', key: 'consigneezip' },
      { header: 'Service Level', key: 'servicelevel' },
      { header: 'Shippers Ref Number', key: 'shippersrefnumber' },
      { header: 'Shipper Ref Number', key: 'shipperrefnumber' },
      { header: 'Outer', key: 'outer' },
      { header: 'Actual Weight (LBs)', key: 'actualweight' },
      { header: 'Job Total Sell', key: 'jobtotalsell' },
    ];
    worksheet.columns = fields;
    worksheet.addRows(rows);
    const buffer = await workbook.xlsx.writeBuffer();

    await sendAnEmail(buffer, filename);
    await uploadFileToS3(buffer, filename);
  }
  catch (error) {
    console.log("fetchDataFromRedshift:", error);
  }
}

async function sendAnEmail(data, filename) {

  let subject = `Weekly Service Report - ${new Date()}`;

  const sesParams = {
    from: process.env.SMTP_FROM,
    to: process.env.SMTP_TO,
    subject: subject,
    text: `This is a Weekly Service Report for ${new Date()}.`,
    attachments: [{
      filename: filename,
      content: data,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }]
  };
  await sendEmail(sesParams);
}

const uploadFileToS3 = async (buffer,filename) => {
  console.log("uploadFileToS3")
  try {
    await s3.upload({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filename,
      Body: buffer ,
      ContentType: "application/vnd.ms-excel",
    }).promise();
  } catch (error) {
    console.log("error",error)
  }
}