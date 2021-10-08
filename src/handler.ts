import S3 from "aws-sdk/clients/s3";
import { exec } from "child_process";
import fse = require("fs-extra");
import { Readable } from "stream";

const s3 = new S3();

export const handler: any = async (event: any): Promise<any> => {
  const lambdaTempFolder = `/tmp/${event.folderName}`;
  await createFolder(lambdaTempFolder);
  const files = await getS3Files(event.s3Path);
  await Promise.all(files.map(async (file: string) => {
    await saveTo(file, lambdaTempFolder);
  }));
  await transfer(event.asperaParams, lambdaTempFolder);
  await cleanupFolder(lambdaTempFolder);
};

async function createFolder(folderName: string): Promise<void> {
  await fse.mkdirs(folderName);
}

async function getS3Files(bucketPath: string): Promise<any[]> {
  const result = await s3
    .listObjectsV2({
      Bucket: process.env.INPUT_BUCKET,
      MaxKeys: 2147483647,
      Delimiter: "/",
      Prefix: bucketPath,
      StartAfter: bucketPath,
    })
    .promise();

  return result.Contents.map(f => f.Key);
}

async function saveTo(s3File: string, lambdaTempFolder: string): Promise<void> {
  const s3Object = getObject(s3File);
  const fileName = s3File.split("/").pop();
  const fileStream = fse.createWriteStream(`${lambdaTempFolder}/${fileName}`);

  return new Promise((resolve, reject) => {
    s3Object
      .pipe(fileStream)
      .on("error", (error: any) => {
        // eslint-disable-next-line
        console.log("error");
        reject(error);
      })
      .on("close", () => {
        resolve();
      });
  });
}

function getObject(file: string): Readable {
  return s3
    .getObject({
      Bucket: process.env.INPUT_BUCKET,
      Key: file,
    })
    .createReadStream()
    .on("error", (err: Error): void => {
      throw err;
    });
}

async function transfer(asperaParams: any, lambdaTempFolder: string): Promise<void> {
  process.chdir(lambdaTempFolder);
  await execute(
    `ascp -d -P${asperaParams.port} ./ ${asperaParams.userName}@${asperaParams.host}:${asperaParams.targetFolder}`,
  );
  process.chdir("../");
}

async function execute(command: string): Promise<void> {
  return new Promise((resolve: any, reject: any) => {
    exec(command, { maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      if (stderr) {
        return;
      }
      resolve();
    });
  });
}

async function cleanupFolder(folderName: string): Promise<void> {
  await fse.remove(folderName);
}
