const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv4 } = require("../utils/s3");
const videoModel = require("./video.model");
const User = require("../@user_entity/user.model");

exports.createVideo = catchAsyncError(async (req, res, next) => {
  const {
    title,
    description,
    video_url,
    genres,
    language,
    keywords,
    access,
    categories,
  } = req.body;

  const result = await s3Uploadv4(req.file, req.userId);

  let genreArray = genres.split(",");
  let keywordsArray = keywords.split(",");
  let categoryArray = categories.split(",");

  const video = await videoModel.create({
    title,
    description,
    thumbnail_url: result.Location,
    video_url,
    genres: genreArray,
    language,
    keywords: keywordsArray,
    access,
    category: categoryArray,
  });

  res.status(200).json({
    success: true,
    video,
  });
});

exports.getVideos = catchAsyncError(async (req, res, next) => {
  const { language, genres, keyword, resultPerPage, currentPage } = req.query;
  const query = {};
  if (language && language != "all") {
    query.language = language;
  }
  if (genres && genres != "all") {
    query.genres = { $in: [genres] };
  }

  if (keyword) {
    const keywordRegExp = new RegExp(keyword, "i");
    query.$or = [
      { title: { $regex: keywordRegExp } },
      { description: { $regex: keywordRegExp } },
    ];
  }

  const totalVideoCount = await videoModel.countDocuments(query);

  const limit = Number(resultPerPage);
  const page = Number(currentPage);
  const skip = (page - 1) * limit;

  let videos = await videoModel
    .find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate("language", "name")
    .populate("genres", "name")
    .populate("category", "name")
    .lean();

  console.log(videos);

  res.status(200).json({
    success: true,
    videos,
    totalVideoCount,
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
  const [video, user] = await Promise.all([
    videoModel
      .findById(req.params.id)
      .populate("language", "name")
      .populate("genres", "name")
      .populate("category", "name"),
    User.findById(req.userId),
  ]);

  if (!video || !user)
    return next(
      new ErrorHandler(`${!video ? "Video" : "User"} not found`, 404)
    );

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

  const {
    title,
    description,
    video_url,
    genres,
    language,
    keywords,
    access,
    categories,
  } = req.body;

  let genreArray = genres.split(",");
  let keywordsArray = keywords.split(",");
  let categoryArray = categories.split(",");

  if (title) video.title = title;
  if (description) video.description = description;
  if (video_url) video.video_url = video_url;
  if (language) video.language = language;
  if (url) video.thumbnail_url = url;
  if (access) video.access = access;
  if (genres) video.genres = genreArray;
  if (keywords) video.keywords = keywordsArray;
  if (categories) video.category = categoryArray;

  await video.save();
  res.status(200).json({
    success: true,
    message: "Video updated successfully",
  });
});
