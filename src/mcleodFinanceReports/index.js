const { send_response } = require('../shared/utils/responses');
const { sqlConfig } = require("../shared/dbConnectivity/index");
const sql = require('mssql');
const { send_email, send_email_for_no_report } = require('../shared/sendEmail/index');
const { filterReportData } = require('../shared/filterReportData/index');
const { createCSV } = require('../shared/csvOperations/index')
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const {mcleodArCmApplyCm}= require('../shared/query/mcleodArCmApplyCm')
const {mcleodArCmHeader}= require('../shared/query/mcleodArCmHeader')
const {mcleodArCmLine}= require('../shared/query/mcleodArCmLine')
const {mcleodArInvoice}= require('../shared/query/mcleodArInvoice')

module.exports.handler = async (event) => {
    console.info("Event: \n", JSON.stringify(event));
    try{
    const queries =[mcleodArCmApplyCm,mcleodArCmHeader,mcleodArCmLine,mcleodArInvoice]
    for (let index = 0; index < queries.length; index++) {
        const element = queries[index];
        console.log(element)
        const queryData = await connectionToSql(element)
        console.log("queryData",queryData)
        const csv = await createCSV(queryData)
        console.log("csv",csv)
        
    }
    }catch(error){
        console.log("error",error)
    }

   
}


async function connectionToSql(query){
    try {
        await sql.connect(sqlConfig)
        const result = await sql.query(query)
        console.log("result",result)
        return result;

    } catch (err) {
        console.log("connectionToSql:error",err)
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