const { send_response } = require('../shared/utils/responses');
const { sqlConfig } = require("../shared/dbConnectivity/index");
const sql = require('mssql');
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const { mcleodArCmApplyCm } = require('../shared/query/mcleodArCmApplyCm')
const { mcleodArCmHeader } = require('../shared/query/mcleodArCmHeader')
const { mcleodArCmLine } = require('../shared/query/mcleodArCmLine')
const { mcleodArInvoice } = require('../shared/query/mcleodArInvoice');
const { transporter } = require('../shared/smtp');
const { parse } = require("json2csv");

module.exports.handler = async (event) => {
    console.info("Event: \n", JSON.stringify(event));
    try {

        const timestamp = new Date()
        const dateWithFileFormat = timestamp.toISOString().substring(5, 10) + '-' + timestamp.toISOString().substring(0, 4) + '.csv'
        const queries = [{ filename: "Mcleod_AR_CM_Apply_" + dateWithFileFormat, query: mcleodArCmApplyCm },
        { filename: "Mcleod_AR_CM_Header_" + dateWithFileFormat, query: mcleodArCmHeader },
        { filename: "Mcleod_AR_CM_Line_" + dateWithFileFormat, query: mcleodArCmLine },
        { filename: "Mcleod_AR_Invoice_" + dateWithFileFormat, query: mcleodArInvoice }]
        const reports = [];
        for (let index = 0; index < queries.length; index++) {
            const element = queries[index];
            const query = element.query
            const filename = element.filename
            const queryData = await connectionToSql(query)
            console.log("queryData", queryData)
            const data = queryData.recordset
            if (!data || data.length == 0) {
                continue;
            };
            /**
             * create csv
             */
            const fields = Object.keys(data[0]);
            const opts = { fields };
            const csv = parse(data, opts);
            await uploadFileToS3(csv, filename)
            reports.push({ filename, content: csv });
        }

        await send_email(transporter, reports)
        return send_response(200);
    } catch (error) {
        cconsole.error("Error : \n", error);
        return send_response(400, error);
    }
}


async function connectionToSql(query) {
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query(query)
        console.log("result", result)
        return result;
    } catch (err) {
        console.log("connectionToSql:error", err)
    }
}



async function uploadFileToS3(csvData, filename) {
    console.log("uploadFileToS3")
    try {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: filename,
            Body: csvData,
            ContentType: "application/octet-stream",
        };
        await s3.putObject(params).promise();
    } catch (error) {
        console.log("error", error);
    }
}



async function send_email(transporter, reports) {
    return new Promise((resolve, reject) => {
        const attachments = reports.map(report => {
            return { filename: report.filename, content: report.content }
        });
        transporter.sendMail(
            {
                from: process.env.SMTP_SENDER,
                to : process.env.SMTP_SENDER,
                //to: "abdul.rashed@bizcloudexperts.com",
                subject: process.env.STAGE + "-Omni-mcleod Finance reports",
                text: "Please check the attachment for report",
                html: "<b>Please check the attachment for report</b>",
                attachments: attachments
            },
            (error, info) => {
                if (error) {
                    console.error("Email Error occurred : \n" + JSON.stringify(error));
                    reject(error);
                }
                console.info("Email sent : \n", JSON.stringify(info));
                resolve(info);
            }
        );
    })
}