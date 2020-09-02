## Data Discovery and Classification of RDS Database in AWS

### Overview

Amazon Macie is a fully managed data security and data privacy service that uses machine learning and pattern matching to discover and protect your sensitive data in AWS.
Today it's only possible to run Amazon Macie Jobs against S3 buckets, so this solution will shows how to discover and classify relational database data from RDS using AWS Database Migration
and also will use Amazon Athena and Amazon QuickSight to simplify the audit assessments on Amazon Macie Jobs results.

![solution](images/rds2macie.png)

As you see, the architecture from the solution that we will show you how to build is described as:

1.	Classic Models demo relational database on RDS for MySQL.
2.	DMS task that connect to Classic Models Demo database and transform the data into a several CSV files and load into S3 bucket.
3.	Once the DMS task has being succeed, the Amazon Macie classification job will start to discover and classified the data and put the results into other S3 bucket. 
4.	Once the classification job results are delivered, Amazon Athena will use Hive to create a table from the job classification results bucket.
5.	Amazon Quicksight will be used to create a data source and start to create audit dashboards.


To get started you will need an IAM user with the following access:

- Amazon Macie
- AWS CloudFormation
- AWS Cloud9
- Amazon RDS
- Amazon Athena
- Amazon S3
- Amazon QuickSight

_Note: Tested in the N. Virginia region (us-east-1)._

### Agenda
1. Enable Amazon Macie - 5 mins
2. Run the initial cloudformation template - 10 mins
3. Configure Macie to export findings to an S3 Bucket - 5 mins
4. Load the sample database into RDS - 1 min
4. Create a classification job to scan all database exported- 10 mins

## Enable Amazon Macie
Your first step is to enable Amazon Macie.  Later we will create data classification jobs to investigate the contents of your S3 buckets and Macie will also do analysis on your S3 buckets and report on any configuration changes.

1. Go to the [Amazon Macie](https://console.aws.amazon.com/macie/home?region=us-east-1) console (us-east-1).
2. Click on the **Get Started** button.
3. Click on the **Enable Macie** button.  If not present then Macie is already enabled.
 
Macie is now enabled and has begun to collect information about the S3 buckets in the account.

## CloudFormation
1. Open the CloudFormation console at https://console.aws.amazon.com/cloudformation
2. On the Welcome page, click on **Create stack** button
3. On the Step 1 - Specify template: Choose Upload a template file, click on **Choose file** button and select the **template.yaml** located inside **deploy** directory
4. On the Step 2 - Specify stack details: Enter the Stack name as **RDS2MacieDemo**
5. On the Step 3 - Configure stack options: Just click on **Next** button
6. On the Step 4 - Review: Enable the checkbox **I acknowledge that AWS CloudFormation might create IAM resources with custom names.**, and click on **Create Stack** button
7. Wait for the stack get into status **CREATE_COMPLETE**
8. Under the Outputs tab, take a note of **EndpointAddress** and **EndpointPort** value
  

## Using Cloud9 environment
1. Open the Cloud9 console at https://console.aws.amazon.com/cloud9
2. On the Step 1 - Name environment: Enter the Environment name as **'webfiltering'**
3. On the Step 2 - Configure settings: Just click on **Next** button
4. On the Step 3 - Review: Check the resources being created, and click on **Create Environment** button 
5. Once your envionment was provisioned, select the **bash** tab and execute the following commands:
```
git init
git add .
git commit -m "Repo Init"
git remote add origin https://git-codecommit.us-east-1.amazonaws.com/v1/repos/cicd-techtalk
git push -u origin master
```

```
CREATE EXTERNAL TABLE `macie_results2`(
  `schemaversion` string COMMENT 'from deserializer', 
  `id` string COMMENT 'from deserializer', 
  `accountid` string COMMENT 'from deserializer', 
  `partition` string COMMENT 'from deserializer', 
  `region` string COMMENT 'from deserializer', 
  `type` string COMMENT 'from deserializer', 
  `title` string COMMENT 'from deserializer', 
  `description` string COMMENT 'from deserializer', 
  `severity` struct<score:string,description:string> COMMENT 'from deserializer', 
  `createdat` string COMMENT 'from deserializer', 
  `resourcesaffected` struct<s3bucket:struct<arn:string,name:string,createdat:string,owner:struct<displayname:string,id:string>>> COMMENT 'from deserializer', 
  `encryptiontype` string COMMENT 'from deserializer', 
  `publicaccess` struct<permissionconfiguration:struct<bucketlevelpermissions:struct<accesscontrollist:struct<allowspublicreadaccess:string,allowspublicwriteaccess:string>,bucketpolicy:struct<allowspublicreadaccess:string,allowspublicwriteaccess:string>,blockpublicaccess:struct<ignorepublicacls:string,restrictpublicbuckets:string,blockpublicacls:string,blockpublicpolicy:string>>,accountlevelpermissions:struct<blockpublicaccess:struct<ignorepublicacls:string,restrictpublicbuckets:string,blockpublicacls:string,blockpublicpolicy:string>>>,effectivepermission:string> COMMENT 'from deserializer', 
  `s3object` struct<bucketarn:string,key:string,path:string,extension:string,lastmodified:string,etag:string,serversideencryption:struct<encryptiontype:string>,size:string,storageclass:string,publicaccess:string> COMMENT 'from deserializer', 
  `category` string COMMENT 'from deserializer')
ROW FORMAT SERDE 
  'org.openx.data.jsonserde.JsonSerDe' 
STORED AS INPUTFORMAT 
  'org.apache.hadoop.mapred.TextInputFormat' 
OUTPUTFORMAT 
  'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION
  's3://[S3Bucket-URL/AWSLogs/[AWS-ACCOUNT-ID]'

```



## Create the first Data Classification Job

Now we are going to create a Data Classification job so we can evaluate the contents of our S3 buckets.  The first job we create will run once a day and evaluate the complete contents of our S3 buckets to make sure we have correctly tagged and classified all our data.  This job will use only the managed identifiers available with Amazon Macie, the complete list of managed identifiers is available [here](https://docs.aws.amazon.com/macie/latest/user/managed-data-identifiers.html).

1. Go to the [Macie console](https://console.aws.amazon.com/macie/home?region=us-east-1).
2. To begin, select the **S3 buckets** option in the left hand menu.
3. Select the three S3 buckets labeled.  You may need to wait a minute and then click ***Refresh icon*** if all the buckets names do not display.
- macieworkshop-env-setup-publicbucket-\<random\>
- macieworkshop-env-setup-internalbucket-\<random\>
- macieworkshop-env-setup-confidentialbucket-\<random\>

4. Click on the **Create job** button. 
> You are now able to verify the S3 buckets you chose before you continue, use the **Previous** or **Remove** buttons if you selected the incorrect S3 buckets.  
5. Click on **Next** to continue.
6. You will now scope your job. Create your job with the following parameters or scope.
- Schedule: Daily  
- Sampling Depth: 100%  
- Leave all other settings as default 
7. Click on **Next** to continue.
> We will not be including any custom data identifiers in this job.
8. Click on **Next** to continue.
9. Give the job a name and description.  

Name|Description
------|-----
**Macie Workshop Scan all buckets**|**Scan all our S3 buckets to discover data using only AWS managed data identifiers**    

10. Click on **Next** to continue.
11. Verify all the details of the job you have created and click on **Submit** to continue.
12. You will see a green banner telling you the ***Job was created successfully***.



## Clean up
1. Delete the solution stack in the following order: Disable Amazon Macie
2. Open the CloudFormation console at https://console.aws.amazon.com/cloudformation
3. Select **RDS2MacieDemo** Stack and click on **Delete** button


## Reference links


## License summary
This sample code is made available under the MIT-0 license. See the LICENSE file.