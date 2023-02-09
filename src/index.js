const { Client } = require('pg');
const { omniOverstockWeeklyReportsSqlQuery } = require("./shared/omniOverstockWeeklyReportsQuery");
const XLSX = require('xlsx');
const fs = require('fs');
const client = require('ssh2').Client;



module.exports.handler = async () => {
  try {
    await fetchDataFromRedshift(omniOverstockWeeklyReportsSqlQuery);
  } catch (err) {
    console.log("handler:error", err);
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
    const filename = "OMNI_OVST_REPORT_" + timestamp.toISOString().substring(5, 10) + '-' + timestamp.toISOString().substring(0, 4) + ".xls"
    console.log(filename)
    await jsonToXls(jreportsArray, filename)
    await uploadFile(filename);
    await client.end();
  }
  catch (error) {
    console.log("fetchDataFromRedshift:", error)
  }
}


async function jsonToXls(jreportsArray, fileName) {
  try {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(jreportsArray);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, fileName);
  }
  catch (error) {
    console.log("jsonToXls:", error)
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
