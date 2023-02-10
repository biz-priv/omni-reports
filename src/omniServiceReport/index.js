const { Client } = require('pg');
const Excel = require('exceljs');

const { sendEmail } = require('../shared/ses');

module.exports.handler = async () => {
  try {
    await fetchDataFromRedshift();
  } catch (err) {
    console.log("handler:error", err);
  }
  console.log("end of the code");
};



async function fetchDataFromRedshift() {
  console.log("process.env.DB_HOST", process.env.DB_HOST);
  console.log("process.env.DB_PORT", process.env.DB_PORT);
  console.log("process.env.DB_USERNAME", process.env.DB_USERNAME);
  console.log("process.env.DB_PASSWORD", process.env.DB_PASSWORD);
  console.log("process.env.DB_DATABASE", process.env.DB_DATABASE);

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  });
  try {
    const query = `
    select
    s.pickup_date as "actualDepartDate",
    --s.file_nbr,
    s.house_bill_nbr as "houseRef",
    s.shipper_name "consignorName",
    s.consignee_name "consigneeName",
    s.consignee_city "consigneeCity",
    s.consignee_st "cosigneeState",
    s.consignee_zip "consigneeZip",
    s.service_level "serviceLevel",
    refb.ref_nbr as "shippersRefNumber",
    refs.ref_nbr as "ShipperRefNumber",
    pieces as "Outer",
    s.actual_wght_lbs as "actualWeight",
    ar.total as "jobTotalSell"
    from 
    (
    select 
    s.source_system,cast(s.pickup_date as date)pickup_date ,s.file_nbr,s.bill_to_nbr,s.house_bill_nbr,s.shipper_name,
    s.consignee_name,s.consignee_city,s.consignee_st,s.consignee_zip,s.service_level,pieces,s.actual_wght_lbs
    from shipment_info s
    where current_Status not in ('CAN')
    and shipment_quote = 'S'
    and source_system = 'WT'
    and bill_to_nbr = '9573'
    and s.file_Date >= current_Date-365
    --and file_nbr = '4952303'
    --and house_bill_nbr = '6988525'
    --and s.file_nbr not in (select distinct file_nbr from shipment_milestone where source_system ='WT' and order_Status = 'DEL')
    )s
    left outer join 
    (select source_system,file_nbr,sum(total)total from ar_invoice_receivables where source_system = 'WT' and is_deleted = 'N' group by file_nbr, source_system)ar
    on 
    s.source_system = ar.source_system
    and s.file_nbr = ar.file_nbr
    left outer join 
    (select source_system ,file_nbr,listagg(distinct ref_nbr,',') within group (order by pk_ref_nbr desc)ref_nbr  from shipment_ref where source_system = 'WT' and customer_type = 'B'
    --and file_nbr = '4984076'
    group by source_system ,file_nbr )refb
    on s.source_system = refb.source_system
    and s.file_nbr= refb.file_nbr
    left outer join 
    (select source_system ,file_nbr,listagg(distinct ref_nbr,',') within group (order by pk_ref_nbr desc)ref_nbr  from shipment_ref where source_system = 'WT' and customer_type = 'S'
    --and file_nbr = '4984076'
    group by source_system ,file_nbr )refs
    on s.source_system = refs.source_system
    and s.file_nbr = refs.file_nbr
    `
    await client.connect();

    const { rows } = await client.query(query);
    await client.end();
    console.log(rows[1]);
    
    const filename = "OMNI_SERVICE_REPORT" + ".xlsx"
    console.log(filename);

    const workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet('Sheet1');

    let fields = [
      { header: 'Actual Departure Date - Y-M-D', key: 'actualDepartDate' }, 
      { header: 'House Ref', key: 'houseRef' },
      { header: 'Consignor Name', key: 'consignorName' },
      { header: 'Consignee Name', key: 'consigneeName' },
      { header: 'Consignee City', key: 'consigneeCity' },
      { header: 'Cosignee State', key: 'cosigneeState' },
      { header: 'Consignee Zip', key: 'consigneeZip' },
      { header: 'Service Level', key: 'serviceLevel' },
      { header: 'Shippers Ref Number', key: 'shippersRefNumber' },
      { header: 'Shipper Ref Number', key: 'ShipperRefNumber' },
      { header: 'Outer', key: 'Outer' },
      { header: 'Actual Weight (LBs)', key: 'actualWeight' },
      { header: 'Job Total Sell', key: 'jobTotalSell' },
    ];
    worksheet.columns = fields;
    worksheet.addRows(rows);
    const buffer = await workbook.xlsx.writeBuffer();
    console.log("Workbook prepared");

    await sendAnEmail(buffer, filename)

    // await convertToCSV(rows, filename);
    // await uploadFile(filename);
    
  }
  catch (error) {
    console.log("fetchDataFromRedshift:", error)
  }
}


async function convertToCSV(jreportsArray, filename) {
  try {
    const csv = json2csv(jreportsArray);
    await fs.promises.writeFile(filename, csv);
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
          const readStream = fs.createReadStream(filename);
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

async function sendAnEmail(data, filename) {

  let subject = `Weekly Service Report - ${new Date()}`;

  console.log("subject", subject);

  console.log("process.env.SMTP_FROM", process.env.SMTP_FROM);

  const sesParams = {
    from: process.env.SMTP_FROM,
    // to: process.env.SMTP_TO,
    to: `yogesh.barot@bizcloudexperts.com`,
    subject: subject,
    text: `This is a weekly service report.`,
    attachments: [{
        filename: filename,
        content: data,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }]
  };
  await sendEmail(sesParams);
}