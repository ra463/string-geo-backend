const videoModel = require("../@video-entity/video.model");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const trailerModel = require("./trailer.model");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");

exports.createTrailer = catchAsyncError(async (req, res, next) => {
  const { video } = req.body;
  const tray = await trailerModel.findOne({});
  if (tray)
    return next(new ErrorHandler("You can add only one video to trailer", 400));

  const trailer = await trailerModel.create({ video });

  res.status(201).json({
    success: true,
    trailer,
    message: "New Trailer Created Successfully",
  });
});

exports.getTrailers = catchAsyncError(async (req, res, next) => {
  const trailers = await trailerModel.find().lean();
  if (trailers.length != 0) {
    const video = await videoModel.findById(trailers[0].video);
    // const expirationTime = new Date();
    // expirationTime.setHours(expirationTime.getHours() + 1);

    // // generate signed url of video
    // const key = process.env.KEY_CLOUD;
    // const pemKey = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
    // const signedUrl = getSignedUrl({
    //   keyPairId: process.env.ID_CLOUD,
    //   privateKey: pemKey,
    //   url: `${process.env.URL_CLOUD}/admin-uploads/${video.video_url}`,
    //   dateLessThan: expirationTime,
    // });
    trailers[0].video_url = video.video_url;
    trailers[0].thumbnail_url = video.thumbnail_url;
  }
  res.status(200).json({
    success: true,
    trailers,
    message: "Trailers fetch successfully",
  });
});

exports.deleteTrailer = catchAsyncError(async (req, res, next) => {
  const trailer = await trailerModel.findByIdAndDelete(req.params.id);
  if (!trailer) {
    return next(new ErrorHandler("Trailer not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Trailer Deleted successfully",
  });
});

exports.getTrailer = catchAsyncError(async (req, res, next) => {
  const trailer = await trailerModel.findById(req.params.id);
  if (!trailer) {
    return next(new ErrorHandler("trailer not found", 404));
  }
  res.status(200).json({
    success: true,
    trailer,
  });
});

exports.getAllVideos = catchAsyncError(async (req, res, next) => {
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
      { keywords: { $in: [keyword] } },
    ];
  }
  query.access = "paid";

  const limit = Number(resultPerPage);
  const page = Number(currentPage);
  const skip = (page - 1) * limit;

  const trailer = await trailerModel.findOne().lean();
  if (trailer) {
    query._id = { $ne: trailer.video };
  }
  const totalVideoCount = await videoModel.countDocuments(query);
  let videos = await videoModel.find(query).lean();

  // for(let i of videos){
  // console.log(videos.length);
  videos = videos.slice(skip, skip + limit);
  // }
  if (trailer) {
    const trailervideo = await videoModel.findById(trailer.video);

    // console.log(trailervideo);
    videos = [trailervideo, ...videos];
  }

  // videos = videos.slice(skip, skip + limit);

  res.status(200).json({
    success: true,
    videos,
    totalVideoCount,
  });
});
