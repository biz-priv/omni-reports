const ObjectsToCsv = require('objects-to-csv');

async function createCSV(reportData) {
    try {
        const csv = new ObjectsToCsv(reportData);
        let today = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0');
        let yyyy = today.getFullYear();
        today = dd + mm + yyyy;
        await csv.toDisk('/tmp/data.csv');
        return today;
    } catch (error) {
        console.error("Creating Csv Error : \n", error);
    }
}
module.exports = { createCSV }