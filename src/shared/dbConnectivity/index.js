const pg = require("pg");


const client = new pg.Pool({
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const sqlConfig = {
    user: 'omnidbadmin',
    password: 'ECTKkjJGJYguAvA7wvKGAqrbqNx577',
    database: 'lme_uat',
    server: 'mcleod-serverfarm-master-uat-mcleoddb-jqpx0dca96va.ckzqjxhguxlx.us-east-1.rds.amazonaws.com',
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
