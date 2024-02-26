const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const { Client } = require('pg');
const { danaherMonthlyReportQuery} = require("../shared/query/danaherMonthlyReport");
const { parse } = require("json2csv");
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
const moment = require('moment');
const client = require('ssh2').Client;

module.exports.handler = async () => {
  try {
    const yesterday = moment().subtract(1, "day")
    // Adjust the month to get the previous month
    const previousMonth = yesterday.month() + 1;
    const previousYear = yesterday.year();
    console.info("year and month:", previousYear, previousMonth)
    const intermediateQuery = danaherMonthlyReportQuery(previousYear, previousMonth)
    const intermediateQueryResult = await fetchDataFromRedshift(intermediateQuery);
    const query = intermediateQueryResult[0]['?column?']
    console.info('🙂 -> file: index.js:21 -> module.exports.handler= -> intermediateQueryResult:', intermediateQueryResult);
    let redShiftData = await fetchDataFromRedshift(query);
    redShiftData = redShiftData.map(({ 'file number': _, 'posted date': __, ...rest }) => rest);
    if (redShiftData?.length > 0) {
      console.log("redShiftData:", redShiftData[0]);
      const filename = `OMNI_DANAHER_MONTHLY_REPORT_${moment().subtract(1, 'months').format('MMMM').toUpperCase()}_${previousYear}.csv`
      console.log(filename)
      const fields = Object.keys(redShiftData[0]);
      console.log("fields:", fields);
      const opts = { fields };
      console.log("opts:", opts);
      const csv = parse(redShiftData, opts);
      await sendFile(csv, filename)
      await uploadFileToS3(filename, csv)
    } else {
      throw new Error('No data retrieved from Redshift.')
    }
  } catch (err) {
    console.log("handler:error", err);
    // Send a notification to the SNS topic
    const params = {
      Message: `An error occurred in function ${process.env.FUNCTION_NAME}. Error details: ${err}.`,
      Subject: `Lambda function ${process.env.FUNCTION_NAME} have failed.`,
      TopicArn: process.env.ERROR_SNS_ARN,
    };
    await sns.publish(params).promise();
  }
  console.log("end of the code");
};


// function to fetch data from redshift.
async function fetchDataFromRedshift(danaherMonthlyReportQuery) {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // database: process.env.DB_DATABASE
    database: 'prod_datamodel'
  });
  try {
    const query = danaherMonthlyReportQuery
    await client.connect();
    const res = await client.query(query);
    const queryData = res.rows
    await client.end();
    return queryData
  }
  catch (error) {
    console.log("fetchDataFromRedshift:", error)
  }
}


// function to send csv through SFTP server.
async function sendFile(csv, filename) {
  try {
    const conn = new client();
    await new Promise((resolve, reject) => {
      conn.on('ready', resolve);
      conn.on('error', reject);
      conn.connect({
        host: process.env.SFTP_HOST,
        port: process.env.SFTP_PORT,
        username: process.env.SFTP_USERNAME,
        password: process.env.SFTP_PASSWORD
      });
    });
    const sftp = await new Promise((resolve, reject) => {
      conn.sftp((err, sftp) => {
        if (err) reject(err);
        else resolve(sftp);
      });
    });
    await new Promise((resolve, reject) => {
      sftp.writeFile(filename, csv, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('File uploaded successfully');
    conn.end();
  } catch (err) {
    console.log(err, 'catch error');
  }
}

// function to upload csv to s3 bucket.
async function uploadFileToS3(filename, csv) {
  console.log("uploadFileToS3")
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `danaherMonthlyReport/${filename}`,
      Body: csv,
      ContentType: "application/octet-stream",
    };
    await s3.putObject(params).promise();
  } catch (error) {
    console.log("error", error);
  }
}