/*
* File: src\hydraFacialReport\index.js
* Project: Omni-reports
* Author: Bizcloud Experts
* Date: 2023-08-23
* Confidential and Proprietary
*/
const { send_response } = require('../shared/utils/responses');
const { client } = require("../shared/dbConnectivity/index");
const { transporter } = require('../shared/smtp/index');
const { send_email, send_email_for_no_report } = require('../shared/sendEmail/index');
const { handleItems } = require('../shared/dynamoDb/index');
const { filterReportData } = require('../shared/filterReportData/index');
const { createCSV } = require('../shared/csvOperations/index')
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });

module.exports.handler = async (event) => {
    console.info("Event: \n", JSON.stringify(event));
    const tableName = process.env.TABLE_NAME;

    try {
        await client.connect();

        // Query For Fetching Shipment Details
        let sqlQuery = `select
        s.file_nbr ,
        house_bill_nbr "AirBill",
        cast(ready_date as date) "Shipment DateTime",
        m.order_Status "Order Status",
        pieces "Total Pieces",
        shipper_name "Shipper Name",
        shipper_city "Shipper City",
        shipper_st "Shipper State",
        r.ref_nbr "Shipper Ref#",
        consignee_name "Consignee Name",
        consignee_city "Consignee City",
        consignee_st "Consignee State",
        cast(schd_delv_date as date) "Scheduled DateTime",
        case when m.order_Status = 'DEL' then event_date else null end  as "POD Date Time"
        from shipment_info s
        join
        (select b.* from
        (select file_nbr ,max(event_date)event_date from shipment_milestone sm
        where source_system = 'WT'
        and is_custompublic = 'Y'
        group by file_nbr ) a join shipment_milestone b
        on a.file_nbr = b.file_nbr
        and a.event_date = b.event_date
        )m
        on s.source_system = m.source_system
        and s.file_nbr = m.file_nbr
        left outer join
        shipment_ref r
        on s.source_system = r.source_system
        and s.file_nbr = r.file_nbr
        and r.customer_type = 'S'
        where (bill_to_nbr = '19911' or cntrl_cust_nbr = '19911')
        and cast(s.ready_date as date) >= '2022-01-01'
        and s.current_status <> 'CAN'`;

        // executing query to db
        
        const response = await client.query(sqlQuery);
        
        let result = response['rows'];
        console.info("Total result Length : ",result.length);

        // separting the data for creating report and for inserting into dynamoDb 
        const [report, dbRows] = await filterReportData(result, tableName);
        const reportData = report.map(({sent_count,...rest}) => ({...rest}));
        console.info("reportData length : ", reportData.length);
        console.info("DbRows : ", dbRows.length);
        // creating csv from report Data 
        if (reportData != false) {
            let csvData = await createCSV(reportData);
            let today = new Date();
            let dd = String(today.getDate()).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0');
            let yyyy = today.getFullYear();
            today = dd + mm + yyyy;
            await uploadFileToS3(csvData,today)

            // inserting in dynamoDb 
            if (dbRows.length > 0) {
                let splitSize = 20;
                for (let key in dbRows) {
                    dbRows[key]['PutRequest']['Item']['delivered'] = true
                }
                for (let i = 0; i < dbRows.length; i += splitSize) {
                    let rows = dbRows.slice(i, i + splitSize);
                    await handleItems(tableName, rows);
                }
            }
            // sending email 
            await send_email(transporter, today);
        }else{
            await send_email_for_no_report(transporter);
            console.info("All the shipments are Delivered, No Rows to Send Report")
        }

        return send_response(200);
    } catch (error) {
        console.error("Error : \n", error);
        const params = {
            Message: `An error occurred in function ${process.env.FUNCTION_NAME}. Error details: ${error}.`,
            Subject: `Lambda function ${process.env.FUNCTION_NAME} have failed.`,
            TopicArn: process.env.ERROR_SNS_ARN,
          };
        await sns.publish(params).promise();  
        return send_response(400, error);
    }
}

async function uploadFileToS3(csvData,today) {
    console.log("uploadFileToS3")
    try {
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: today+'.csv',
        Body: csvData,
        ContentType: "application/octet-stream",
      };
      await s3.putObject(params).promise();
    } catch (error) {
      console.log("error", error);
    }
  }