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