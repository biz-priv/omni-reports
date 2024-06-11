/*
* File: src\shared\dbConnectivity\index.js
* Project: Omni-reports
* Author: Bizcloud Experts
* Date: 2023-05-05
* Confidential and Proprietary
*/
const pg = require("pg");


const client = new pg.Pool({
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_HOST,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        trustServerCertificate: false // change to true for local dev / self-signed certs
    }
}

module.exports = { client, sqlConfig }
