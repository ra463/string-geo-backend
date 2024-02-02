const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv4 } = require("../utils/s3");
const videoModel = require("./video.model");

exports.createVideo = catchAsyncError(async (req, res, next) => {
  const { title, description, video_url, categories, language, keywords } =
    req.body;

  const result = await s3Uploadv4(req.file, req.userId);

  let categoryArray = categories.split(",");
  let keywordsArray = keywords.split(",");

  const video = videoModel.create({
    title,
    description,
    thumbnail_url: result.Location,
    video_url,
    categories: categoryArray,
    language,
    keywords: keywordsArray,
  });

  res.status(200).json({
    success: true,
    video,
  });
});

exports.getVideos = catchAsyncError(async (req, res, next) => {
  const { language, category, keyword } = req.query;
  const query = {};
  if (language && language != "all") {
    query.language = language;
  }
  if (category && category != "all") {
    query.categories = { $in: [category] };
  }

  if (keyword) {
    const keywordRegExp = new RegExp(keyword, "i");
    query.$or = [
      { title: { $regex: keywordRegExp } },
      { description: { $regex: keywordRegExp } },
    ];
  }
  const videos = await videoModel.find(query).lean();
  //   console.log(videos)
  res.status(200).json({
    success: true,
    videos,
    message: "Videos fetch successfully",
  });
});

exports.deleteVideo = catchAsyncError(async (req, res, next) => {
  const video = await videoModel.findByIdAndDelete(req.params.id);
  if (!video) {
    return next(new ErrorHandler("Video not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Videos Deleted successfully",
  });
});

exports.getVideo = catchAsyncError(async (req, res, next) => {
  const video = await videoModel.findById(req.params.id);
  if (!video) {
    return next(new ErrorHandler("Video not found", 404));
  }

  const expirationTime = new Date();
  expirationTime.setHours(expirationTime.getHours() + 1);

  // generate signed url of video
  const key = process.env.KEY_CLOUD;
  const pemKey = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
  const signedUrl = getSignedUrl({
    keyPairId: process.env.ID_CLOUD,
    privateKey: pemKey,
    url: `${process.env.URL_CLOUD}/${video.video_url}`,
    dateLessThan: expirationTime,
  });

  video.video_url = signedUrl;

  res.status(200).json({
    success: true,
    video,
    message: "Video find successfully",
  });
});

exports.updateVideo = catchAsyncError(async (req, res, next) => {
  const video = await videoModel.findById(req.params.id);

  if (!video) {
    return next(new ErrorHandler("Video not found", 404));
  }
  let url = "";
  if (req.file) {
    const result = await s3Uploadv4(req.file, req.userId);
    url = result.Location;
  }

  const { title, description, video_url, categories, language, keywords } =
    req.body;

  if (title) video.title = title;
  if (description) video.description = description;
  if (video_url) video.video_url = video_url;
  if (categories) video.categories = categories;
  if (language) video.language = language;
  if (keywords) video.keywords = keywords;
  if (url) video.thumbnail_url = url;

  await video.save();
  res.status(200).json({
    success: true,
    message: "Video updated successfully",
  });
});
