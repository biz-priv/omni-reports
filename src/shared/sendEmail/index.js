/*
* File: src\shared\sendEmail\index.js
* Project: Omni-reports
* Author: Bizcloud Experts
* Date: 2023-02-21
* Confidential and Proprietary
*/
async function send_email(transporter, today) {
    return new Promise((resolve, reject) => {
        transporter.sendMail(
            {
                from: process.env.SMTP_SENDER,
                to: process.env.SMTP_RECEIVER,
                subject: process.env.stage + "-HydraFacial Daily Milestone Report Omni Logistics",
                text: "Please check the attachment for report",
                html: "<b>Please check the attachment for report</b>",
                attachments: [
                    {
                        filename: 'OmniTrackingReport_' + today + '.csv',
                        path: '/tmp/data.csv'
                    },
                ],
            },
            (error, info) => {
                if (error) {
                    console.error("Email Error occurred : \n" + JSON.stringify(error));
                    reject(error);
                }
                console.info("Email sent : \n", JSON.stringify(info));
                resolve(info);
            }
        );
    })
}

async function send_email_for_no_report(transporter) {
    return new Promise((resolve, reject) => {
        transporter.sendMail(
            {
                from: process.env.SMTP_SENDER,
                to: process.env.SMTP_RECEIVER,
                subject: process.env.stage + "-HydraFacial Daily Milestone Report Omni Logistics",
                text: "No Shipments To Send In The Report",
                html: "<b>No Shipments To Send In The Report</b>",
            },
            (error, info) => {
                if (error) {
                    console.error("Email Error occurred : \n" + JSON.stringify(error));
                    reject(error);
                }
                console.info("Email sent : \n", JSON.stringify(info));
                resolve(info);
            }
        );
    })
}

module.exports = { send_email, send_email_for_no_report }

