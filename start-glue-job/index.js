const AWS = require('aws-sdk');
var glue = new AWS.Glue();

const JOB_NAME = process.env.JOB_NAME;

exports.handler = async(event) => {
    let s3 = event.Records[0].s3;
    console.log(`Starting DCP Glue Job for s3://${s3.bucket.name}/${s3.object.key}`);
    
    return await glue.startJobRun({ JobName: JOB_NAME }).promise();
};
