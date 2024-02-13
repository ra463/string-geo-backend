const catchAsyncError = require("../utils/catchAsyncError");
const Category = require("./category.model");
const ErrorHandler = require("../utils/errorHandler");
const Video = require("../@video-entity/video.model");

exports.createCategory = catchAsyncError(async (req, res, next) => {
  const { name, status } = req.body;

  const category = await Category.create({ name, status, video_array: [] });

  res.status(201).json({
    success: true,
    category,
    message: "New Category Created Successfully",
  });
});

exports.getCategories = catchAsyncError(async (req, res, next) => {
  const categories = await Category.find()
    .populate("video_array.video", "title description thumbnail_url video_url")
    .lean();

  res.status(200).json({
    success: true,
    categories,
  });
});

exports.getCategory = catchAsyncError(async (req, res, next) => {
  const category = await Category.findById(req.params.id).populate(
    "video_array.video"
  );
  if (!category) return next(new ErrorHandler("Category not found", 404));

  res.status(200).json({
    success: true,
    category,
  });
});

exports.updateCategory = catchAsyncError(async (req, res, next) => {
  const { name, status } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) return next(new ErrorHandler("Category not found", 404));

  if (name) category.name = name;
  if (status) category.status = status;

  await category.save();
  res.status(200).json({
    success: true,
    category,
    message: "Category Updated successfully",
  });
});

exports.getCategoryWithVideo = catchAsyncError(async (req, res, next) => {
  const category = await Category.findById(req.params.id).populate(
    "video_array.video",
    "title description thumbnail_url video_url views"
  );
  if (!category) return next(new ErrorHandler("Category not found", 404));

  res.status(200).json({
    success: true,
    category_videos: category,
  });
});

exports.addVideoToCategory = catchAsyncError(async (req, res, next) => {
  const { video_id } = req.body;
  const [category, video] = await Promise.all([
    Category.findById(req.params.id),
    Video.findById(video_id),
  ]);

  if (!category) return next(new ErrorHandler("Category not found", 404));
  if (!video) return next(new ErrorHandler("Video not found", 404));

  if (category.video_array.length === 9) {
    return next(new ErrorHandler("Maximum 9 videos allowed", 400));
  }

  if (category.video_array.length === 0) {
    category.video_array.push({ video: video_id, sequence: 1 });
  } else {
    const video = category.video_array.find(
      (video) => video.video.toString() === video_id
    );
    if (!video) {
      category.video_array.push({
        video: video_id,
        sequence: category.video_array.length + 1,
      });
    } else {
      return next(new ErrorHandler("Video already added to category", 400));
    }
  }

  await category.save();
  res.status(200).json({
    success: true,
    message: "Video added to category",
  });
});

// exports.editCategorySequence = catchAsyncError(async (req, res, next) => {
//   const category = await Category.findById(req.params.id);
//   if (!category) return next(new ErrorHandler("Category not found", 404));

//   const { video_id_1, video_id_2, sequence_1, sequence_2 } = req.body;

//   const video_1 = category.video_array.find(
//     (video) => video.video.toString() === video_id_1
//   );
//   const video_2 = category.video_array.find(
//     (video) => video.video.toString() === video_id_2
//   );

//   if (!video_1 || !video_2) {
//     return next(new ErrorHandler("Video not found", 404));
//   }

//   video_1.sequence = sequence_1;
//   video_2.sequence = sequence_2;

//   await category.save();
//   res.status(200).json({
//     success: true,
//     category,
//   });
// });

exports.removeVideoFromCategory = catchAsyncError(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new ErrorHandler("Category not found", 404));

  const { video_id } = req.body;

  const selected_video = category.video_array.find(
    (video) => video.video.toString() === video_id
  );
  if (!selected_video) return next(new ErrorHandler("Video not found", 404));

  category.video_array = category.video_array.filter(
    (video) => video.video.toString() !== video_id
  );

  category.video_array = category.video_array.sort(
    (a, b) => a.sequence - b.sequence
  );
  category.video_array = category.video_array.map((data, index) => {
    return { ...data, sequence: index + 1 };
  });

  await category.save();
  res.status(200).json({
    success: true,
    message: "Video removed from category",
  });
});

exports.deleteCategory = catchAsyncError(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new ErrorHandler("Category not found", 404));

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: "Category Deleted successfully",
  });
});

exports.shuffleCategorySequence = catchAsyncError(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new ErrorHandler("Category not found", 404));
  let { video_array } = req.body;
  // console.log(video_array);
  video_array = video_array.sort((a, b) => a.sequence - b.sequence);
  video_array = video_array.map((data, index) => {
    return { ...data, sequence: index + 1 };
  });
  // console.log(video_array);
  category.video_array = video_array;

  await category.save();

  res.status(200).json({
    success: true,
    message: "Category Deleted successfully",
  });
});
