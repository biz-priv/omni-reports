const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const { Client } = require('pg');
const { omniOverstockWeeklyReportsSqlQuery } = require("../shared/query/omniOverstockWeeklyReportsQuery");
const json2csv = require('json2csv').parse;
const fs = require('fs');
const client = require('ssh2').Client;
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });

module.exports.handler = async () => {
  try {
    await fetchDataFromRedshift(omniOverstockWeeklyReportsSqlQuery);
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

async function fetchDataFromRedshift(omniOverstockWeeklyReportsSqlQuery) {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  });
  try {
    const query = omniOverstockWeeklyReportsSqlQuery
    await client.connect();
    const res = await client.query(query);
    console.log(res.rows[1]);
    const jreportsArray = res.rows
    const timestamp = new Date()
    const filename = "OMNI_OVST_REPORT_" + timestamp.toISOString().substring(5, 10) + '-' + timestamp.toISOString().substring(0, 4) + ".csv"
    console.log(filename)
    await convertToCSV(jreportsArray, filename);
    await uploadFile(filename);
    await client.end();
  }
  catch (error) {
    console.log("fetchDataFromRedshift:", error)
  }
}

async function convertToCSV(jreportsArray, filename) {
  try {
    const csv = json2csv(jreportsArray);
    await uploadFileToS3(csv,filename)
    await fs.promises.writeFile("/tmp/" + filename, csv);
    console.log(`JSON data successfully converted to CSV and saved at ${filename}`);
  } catch (error) {
    console.error(`Error converting JSON data to CSV: ${error}`);
  }
}

const uploadFile = (filename) => {
  return new Promise(async (resolve, reject) => {
    try {
      const conn = new client();
      conn.on('ready', function () {
        conn.sftp(function (err, sftp) {
          if (err) throw err;
          const readStream = fs.createReadStream("/tmp/" + filename);
          console.log("readStream==> ", readStream)
          const writeStream = sftp.createWriteStream(`/incoming/${filename}`);
          writeStream.on('close', function () {
            console.log('File has been transferred successfully!');
            conn.end();
            resolve("connection ended")
          });
          readStream.pipe(writeStream);
        });
      }).connect({
        host: process.env.SFTP_HOST,
        port: process.env.SFTP_PORT,
        username: process.env.SFTP_USERNAME,
        password: process.env.SFTP_PASSWORD
      });
    } catch (error) {
      console.log("Error:uploadFile", error)
      reject(error)
    }
  })
}

async function uploadFileToS3(csv,filename) {
  console.log("uploadFileToS3")
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filename,
      Body: csv,
      ContentType: "application/octet-stream",
    };
    await s3.putObject(params).promise();
  } catch (error) {
    console.log("error", error);
  }
}