"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const s3_1 = __importDefault(require("aws-sdk/clients/s3"));
const child_process_1 = require("child_process");
const fse = require("fs-extra");
const s3 = new s3_1.default();
const handler = async (event) => {
    const lambdaTempFolder = `/tmp/${event.folderName}`;
    await createFolder(lambdaTempFolder);
    const files = await getS3Files(event.s3Path);
    await Promise.all(files.map(async (file) => {
        await saveTo(file, lambdaTempFolder);
    }));
    await transfer(event.asperaParams, lambdaTempFolder);
    await cleanupFolder(lambdaTempFolder);
};
exports.handler = handler;
async function createFolder(folderName) {
    await fse.mkdirs(folderName);
}
async function getS3Files(bucketPath) {
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
async function saveTo(s3File, lambdaTempFolder) {
    const s3Object = getObject(s3File);
    const fileName = s3File.split("/").pop();
    const fileStream = fse.createWriteStream(`${lambdaTempFolder}/${fileName}`);
    return new Promise((resolve, reject) => {
        s3Object
            .pipe(fileStream)
            .on("error", (error) => {
            console.log("error");
            reject(error);
        })
            .on("close", () => {
            resolve();
        });
    });
}
function getObject(file) {
    return s3
        .getObject({
        Bucket: process.env.INPUT_BUCKET,
        Key: file,
    })
        .createReadStream()
        .on("error", (err) => {
        throw err;
    });
}
async function transfer(asperaParams, lambdaTempFolder) {
    process.chdir(lambdaTempFolder);
    await execute(`ascp -d -P${asperaParams.port} ./ ${asperaParams.userName}@${asperaParams.host}:${asperaParams.targetFolder}`);
    process.chdir("../");
}
async function execute(command) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, { maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
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
async function cleanupFolder(folderName) {
    await fse.remove(folderName);
}
//# sourceMappingURL=handler.js.map