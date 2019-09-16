import * as AWS from "aws-sdk";
import * as fs from "fs";
import * as path from "path";
import * as chokidar from "chokidar";
import * as csv from "csvtojson";
import Move from "./move";

const accessKeyId = process.env["AWS_KEYID"];
const secretAccessKey = process.env["AWS_SECRET"];
const region = process.env["AWS_REGION"];
const queueUrl = process.env["QUEUE_URL"];
const watchPath = process.env["WATCH_PATH"];
const archivesDir = process.env["ARCHIVES_DIR"] || "_archives";
const errorsDir = process.env["ERRORS_DIR"] || "_errors";
let messageAttributes = {};

if (process.env["MESSAGE_ATTRIBUTES"]) {
  try {
    messageAttributes = JSON.parse(process.env["MESSAGE_ATTRIBUTES"]);
  } catch (err) {
    console.error("Failed to parse MESSAGE_ATTRIBUTES:", err.message);
    process.exit(1);
  }
}

console.log("AWS_KEYID=" + accessKeyId);
console.log("AWS_SECRET=" + (secretAccessKey ? "**********" : ""));
console.log("AWS_REGION=" + region);
console.log("QUEUE_URL=" + queueUrl);
console.log("WATCH_PATH=" + watchPath);
console.log("ARCHIVES_DIR=" + archivesDir);
console.log("ERRORS_DIR=" + errorsDir);
console.log("MESSAGE_ATTRIBUTES=" + JSON.stringify(messageAttributes));
console.log("-------------------");
if (!accessKeyId || !secretAccessKey || !region || !queueUrl || !watchPath) {
  console.error(
    "You must set environement variables : AWS_KEYID, AWS_SECRET, AWS_REGION, QUEUE_URL, WATCH_PATH"
  );
  process.exit(1);
}

const move = new Move(
  path.join(watchPath, archivesDir),
  path.join(watchPath, errorsDir)
);

AWS.config.update({ region, accessKeyId, secretAccessKey });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

const watcher = chokidar.watch(watchPath, {
  depth: 0,
  persistent: true,
  disableGlobbing: true,
  awaitWriteFinish: true,
});

watcher.on("add", async function(path, stats) {
  console.log("Got a new file:", path);
  csv({ delimiter: ";" })
    .fromFile(path)
    .then(
      json => {
        const params: AWS.SQS.SendMessageRequest = {
          MessageAttributes: messageAttributes,
          MessageBody: JSON.stringify(json),
          QueueUrl: queueUrl,
        };
        sqs
          .sendMessage(params)
          .promise()
          .then(function() {
            console.log("OK:", path);
            move.toArchives(path);
          })
          .catch(err => {
            console.error("ERROR:", path, err.message);
            move.toError(path);
          });
      },
      err => {
        console.error("ERROR:", path, "(" + err.name + ")");
        move.toError(path);
      }
    );
});