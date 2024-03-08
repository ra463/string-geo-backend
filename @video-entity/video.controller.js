const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv4 } = require("../utils/s3");
const videoModel = require("./video.model");
const User = require("../@user_entity/user.model");
const axios = require("axios");
const xml2js = require("xml2js");
const parseM3U8 = require("parse-m3u8");
const trailerModel = require("../@trailer_entity/trailer.model");

const Category = require("../@category_entity/category.model");

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
  const { language, genres, keyword, resultPerPage, currentPage, sortBy } =
    req.query;
  const query = {};
  let orderBy = 1;
  if (sortBy && sortBy == "latest") {
    orderBy = -1;
  } else {
    orderBy = 1;
  }
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

  const totalVideoCount = await videoModel.countDocuments(query);

  const limit = Number(resultPerPage);
  const page = Number(currentPage);
  const skip = (page - 1) * limit;
  let user;
  if (req.query.id) {
    user = await User.findById(req.query.id);
  }

  let videos = await videoModel
    .find(query)
    .sort({ createdAt: orderBy })
    .skip(skip)
    .limit(limit)
    .populate("language", "name")
    .populate("genres", "name")
    .populate("category", "name")
    .lean();

  videos = videos.map((video) => {
    if (user) {
      if (user.watch_list.includes(video._id)) {
        video.inWatchList = true;
      } else {
        video.inWatchList = false;
      }
    }
    if (!user) {
      video.inWatchList = false;
    }
    return video;
  });

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

  const categorys = await Category.find();
  for (let category of categorys) {
    category.video_array = category.video_array.filter(
      (data) => data.video != req.params.id
    );
    category.video_array = category.video_array.map((data, index) => {
      return { ...data, sequence: index + 1 };
    });
    await category.save();
  }

  const trailer = await trailerModel.find({});
  if (trailer.length) {
    if (trailer[0].video == video._id) {
      await trailerModel.findByIdAndDelete(trailer[0]._id);
    }
  }

  res.status(200).json({
    success: true,
    message: "Videos Deleted successfully",
  });
});

exports.getVideosOfCategory = catchAsyncError(async (req, res, next) => {
  const videos = await videoModel.find({ category: { $in: [req.params.id] } });

  res.status(200).json({
    success: true,
    videos_category: videos,
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

// exports.getSingnedUrls = catchAsyncError(async (req, res, next) => {
//   const domain = `localhost:3000`;
//   const expirationTime = new Date();
//   expirationTime.setHours(expirationTime.getHours() + 1);
//   const policy = {
//     Statement: [
//       {
//         Resource:
//           "https://d3i0jph7swoo8z.cloudfront.net/fa54aed21cf981f2492407770838a9f9",
//         Condition: {
//           DateLessThan: {
//             "AWS:EpochTime": Math.floor(new Date().getTime() / 1000) + 3600,
//           },
//           IpAddress: {
//             "AWS:SourceIp": "171.60.192.241"
//           }
//           // Referer: {
//           //   "AWS:Referer": "https://string-geo-admin.vercel.app",
//           // },
//         },
//       },
//     ],
//   };

//   const key = process.env.KEY_CLOUD;
//   const pemKey = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
//   const signedUrl = getSignedUrl({
//     keyPairId: process.env.ID_CLOUD,
//     privateKey: pemKey,
//     url: "https://d3i0jph7swoo8z.cloudfront.net/fa54aed21cf981f2492407770838a9f9",
//     policy: JSON.stringify(policy),
//   });
//   return res.status(200).json({ success: true, signedUrl });
// });

exports.getSingnedUrls = catchAsyncError(async (req, res, next) => {
  const expirationTime = new Date();
  expirationTime.setHours(expirationTime.getHours() + 48);

  // // generate signed url of video
  const key = process.env.KEY_CLOUD;
  const pemKey = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
  function mf(key) {
    const url = getSignedUrl({
      keyPairId: process.env.ID_CLOUD,
      privateKey: pemKey,
      url: `${process.env.URL_CLOUD}/${key}`,
      dateLessThan: expirationTime,
    });
    return url;
  }

  const signedUrl = mf("y.mpd");
  console.log(signedUrl);
  const parser = new xml2js.Parser();
  const { data } = await axios.get(signedUrl);
  const xmlToJson = await parser.parseStringPromise(data);

  const baseURLs = xmlToJson.MPD.Period.map((period) =>
    period.AdaptationSet.map((adaptationSet) =>
      adaptationSet.Representation.map((rep) => rep.BaseURL)
    )
  );
  const baseURLsFlat = [].concat.apply([], [].concat.apply([], baseURLs));

  const signedURLs = await Promise.all(
    baseURLsFlat.map(async (baseURL) => {
      const signedUrl = mf(baseURL[0]);
      return signedUrl;
    })
  );

  for (let i = 0; i < baseURLsFlat.length; i++) {
    xmlToJson.MPD.Period.map((period) =>
      period.AdaptationSet.map((adaptationSet) =>
        adaptationSet.Representation.map((rep) => {
          if (rep.BaseURL[0] === baseURLsFlat[i][0]) {
            rep.BaseURL[0] = signedURLs[i];
          }
        })
      )
    );
  }

  const builder = new xml2js.Builder();
  const xml = builder.buildObject(xmlToJson);
  res.set("Content-Type", "application/xml");
  res.send(xml);

  // const key = process.env.KEY_CLOUD;

  // const expirationTime = new Date();
  // expirationTime.setHours(expirationTime.getHours() + 23);
  // const pemKey = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
  // const signedUrl = getSignedUrl({
  //   keyPairId: process.env.ID_CLOUD,
  //   privateKey: pemKey,
  //   url: "https://dewv7gdonips4.cloudfront.net/Yvideom3u8",
  //   dateLessThan: expirationTime,
  // });

  // const { data } = await axios.get(signedUrl);
  // // const m3u8Text = await data.text();
  // const parsedPlaylist = parseM3U8(data);
  // const signedPlaylist = parsedPlaylist.segments.map((segment) => {
  //   const tsUrl = segment.uri;
  //   const signedTsUrl = getSignedUrl({
  //     keyPairId: process.env.ID_CLOUD,
  //     privateKey: pemKey,
  //     url: `https://dewv7gdonips4.cloudfront.net/${tsUrl}`,
  //     dateLessThan: expirationTime,
  //   });
  //   return { ...segment, uri: signedTsUrl };
  // });

  // const updatedPlaylist = { ...parsedPlaylist, segments: signedPlaylist };

  // const m3u8Content = JSON.stringify(updatedPlaylist);
  // res
  //   .set({
  //     "Content-Type": "application/vnd.apple.mpegurl",
  //     "Content-Disposition": 'attachment; filename="playlist.m3u8"',
  //   })
  //   .status(200)
  //   .send(m3u8Content);

  // const m3u8Content = parseM3U8.write(updatedPlaylist);
  //   const tempFilePath = '/file.m3u8';
  //   fs.writeFileSync(tempFilePath, m3u8Content);

  //   const fileContent = fs.readFileSync(tempFilePath, 'utf-8');

  //   fs.unlinkSync(tempFilePath)
  //   res.set({
  //     'Content-Type': 'application/vnd.apple.mpegurl',
  //     'Content-Disposition': 'attachment; filename="playlist.m3u8"'
  //   }).status(200).send(fileContent);

  // return res.status(200).json({ success: true, signedUrl });
});

exports.get = catchAsyncError(async (req, res, next) => {
  const videos = await videoModel.find({});
  for (let i = 67; i < 70; ++i) {
    console.log(i)
    const data = await axios.get(`${videos[i].thumbnail_url}`, {
      responseType: "arraybuffer",
    });
    // console.log(videos[i].thumbnail_url.split(".")[videos[i].thumbnail_url.split(".").length-1])
    const data2 = await s3Uploadv4(
      data.data,
      "bchdbhcbdhcbhdb",
      videos[i].thumbnail_url.split(".com/")[1].replaceAll("%","")
    );
    videos[i].thumbnail_url = data2.Location;
    await videos[i].save();
  }

  res.status(200).json({
    success: true,
    // videos
  });
});
