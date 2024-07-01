/*
* File: src\shared\smtp\index.js
* Project: Omni-reports
* Author: Bizcloud Experts
* Date: 2024-02-21
* Confidential and Proprietary
*/
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});
module.exports = { transporter }
