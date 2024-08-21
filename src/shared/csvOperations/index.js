/*
* File: src\shared\csvOperations\index.js
* Project: Omni-reports
* Author: Bizcloud Experts
* Date: 2023-05-01
* Confidential and Proprietary
*/
const ObjectsToCsv = require('objects-to-csv');

async function createCSV(reportData) {
    try {
        const csv = new ObjectsToCsv(reportData);
        const result=await csv.toDisk('/tmp/data.csv');
        return result;
    } catch (error) {
        console.error("Creating Csv Error : \n", error);
    }
}
module.exports = { createCSV }