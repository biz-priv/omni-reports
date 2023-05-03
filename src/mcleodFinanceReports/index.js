const { send_response } = require('../shared/utils/responses');
const { sqlConfig } = require("../shared/dbConnectivity/index");
const sql = require('mssql');
const { send_email, send_email_for_no_report } = require('../shared/sendEmail/index');
const { filterReportData } = require('../shared/filterReportData/index');
const { createCSV } = require('../shared/csvOperations/index')
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

module.exports.handler = async (event) => {
    console.info("Event: \n", JSON.stringify(event));
    async () => {
        try {
            await sql.connect(sqlConfig)
            const result = await sql.query`select top 5 * from other_charge_hist`
            console.dir(result)
        } catch (err) {
            // ... error checks
        }
    }
}

async function uploadFileToS3(csvData, today) {
    console.log("uploadFileToS3")
    try {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: today + '.csv',
            Body: csvData,
            ContentType: "application/octet-stream",
        };
        await s3.putObject(params).promise();
    } catch (error) {
        console.log("error", error);
    }
}