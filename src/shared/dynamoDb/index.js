const AWS = require("aws-sdk");

/* insert record in table */
async function handleItems(tableName, record) {
  let documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.DEFAULT_AWS,
  });

  let params = {
    RequestItems: {
      [`${tableName}`]: record
    }
  }
  try {
    return await documentClient.batchWrite(params).promise();
  } catch (e) {
    console.error("Item Insert Error: ", e);
    return e;
  }
}

async function dbRead(params) {
  try {
    const documentClient = new AWS.DynamoDB.DocumentClient({
      region: process.env.DEFAULT_AWS,
    });
    let result = await documentClient.scan(params).promise();
    let data = result.Items;
    if (result.LastEvaluatedKey) {
      params.ExclusiveStartKey = result.LastEvaluatedKey;
      data = data.concat(await dbRead(params));
    }
    return data;
  } catch (error) {
    console.info("DynamoDb Scanning Error", error);
    return error;
  }
}

/* retrieve all items from table */
async function scanTableData(tableName, fileNumber) {
  let params = {
    TableName: tableName,
    FilterExpression: 'file_nbr = :value AND delivered = :value2',
    ExpressionAttributeValues: { ':value': fileNumber , ':value2': true },
  };

  let data = await dbRead(params);
  return data;
}


module.exports = { handleItems, scanTableData }