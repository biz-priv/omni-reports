const { scanTableData } = require('../dynamoDb/index');

async function filterReportData(result, tableName) {
    try {
        let dbRows = [];
        let reportData = [];
        for (let key in result) {
            result[key]['scheduled datetime'] = JSON.stringify(result[key]['scheduled datetime']);
            result[key]['scheduled datetime'] = `${(result[key]['scheduled datetime']).split('T')[0]}"`;
            result[key]['pod date time'] = JSON.stringify(result[key]['pod date time']);
            result[key]['pod date time'] = `${(result[key]['pod date time']).split('T')[0]}"`;
            result[key]['shipment datetime'] = JSON.stringify(result[key]['shipment datetime']);
            result[key]['shipment datetime'] = `${(result[key]['shipment datetime']).split('T')[0]}"`
            let row = result[key];
            if (result[key]['order status'] == "DEL") {
                let shipment = await scanTableData(tableName, result[key]['file_nbr']);
                if (shipment.length) {
                    if(shipment[0].sent_count != 3){
                        reportData.push(row);
                        result[key]['sent_count'] = shipment[0].sent_count + 1
                        let updateSentCount = result[key]
                        let rowObj = {
                            PutRequest: {
                                Item: updateSentCount
                            }
                        }
                        let checkFileNumber = dbRows.find((x) => x.PutRequest.Item.file_nbr == result[key]['file_nbr']);
                        if(checkFileNumber == undefined){
                            dbRows.push(rowObj);
                        }
                    }
                }else {
                        reportData.push(row);
                        result[key]['sent_count'] = 1
                        let updateSentCount = result[key]
                        let rowObj = {
                            PutRequest: {
                                Item: updateSentCount
                            }
                        }
                        let checkResult = dbRows.find((x) => x.PutRequest.Item.file_nbr == result[key]['file_nbr']);
                        if(checkResult == undefined){
                            dbRows.push(rowObj);
                        }
                }
            } else {
                reportData.push(result[key]);
            }
        }
        return [reportData, dbRows];
    } catch (error) {
        console.info(error);
        return [false, error];
    }
}
module.exports = { filterReportData }