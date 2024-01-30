const aws = require("aws-sdk");
const SDK = require("aws-sdk");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const crypto = require("crypto");
const { promisify } = require("util");
const dotenv = require("dotenv");
const multer = require("multer");

dotenv.config({
  path: "../config/config.env",
});

const randomBytes = promisify(crypto.randomBytes);

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION,
  signatureVersion: "v4",
});

exports.generateUploadURL = async () => {
  const rawBytes = await randomBytes(16);
  const imageName = rawBytes.toString("hex");

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageName,
    Expires: 2400,
  };

  const uploadURL = await s3.getSignedUrlPromise("putObject", params);
  return uploadURL;
};

exports.s3Uploadv4 = async (file, id) => {
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  if (file.mimetype.split("/")[0] === "image") {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/user-${id}/profile/${Date.now().toString()}-${
        file.originalname
      }`,
      Body: file.buffer,
    };

    return await s3.upload(params).promise();
  }

  // for pdf
  if (file.mimetype.split("/")[0] === "application") {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/user-${id}/pdf/${Date.now().toString()}-${
        file.originalname
      }`,
      Body: file.buffer,
    };

    return await s3.upload(params).promise();
  }
};

const storage = multer.memoryStorage();

const fileFilter = async (req, file, cb) => {
  if (
    file.mimetype.split("/")[0] === "image" ||
    file.mimetype.split("/")[0] === "application"
  ) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5, files: 1 },
});
