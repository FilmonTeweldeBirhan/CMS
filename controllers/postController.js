const fs = require("fs");
const catchAsync = require("./../utils/catchAsync");
const APPError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");
const multer = require("multer");
const sharp = require("sharp");

const Post = require("./../models/postModel");
const Reveiw = require("./../models/reviewModel");
const Category = require("../models/categoryModel");

/* ==============================
   =====MULTER CONFIGURATION=====
   ============================== */
// Chose memoryStorage
const multerStorage = multer.memoryStorage();

// Filter files
const multerFilter = (req, file, cb) => {
  // Check if the file is an image if not send an error!
  if (!file.mimetype.startsWith("image")) {
    return cb(
      new APPError("Invalid file, please provide images only.", 400),
      false
    );
  }

  // if the file is an image
  cb(null, true);
};

// Configure the multer using multerstorage and multerFilter
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Get the files using their name attribute
exports.uploadPostImage = upload.fields([
  { name: "post_imageCover", maxCount: 1 },
  { name: "post_images", maxCount: 3 },
]);

/* ==============================
   ====== IMAGE PROCCESSING =====
   ============================== */
exports.resizeImage = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  // 1) Check if the imageCover field is there if not leave it
  if (!req.files.post_imageCover) return next();

  // 2) Send filePath of imageCover to the req.body
  req.body.post_imageCover = `post-${Date.now()}-cover.jpeg`;

  // 3) Resize the imageCover using sharp
  // we're using it as array bc it comes from FormData()
  await sharp(req.files.post_imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/images/posts/${req.body.post_imageCover}`);

  // If there is no post_images
  if (!req.files.post_images) return next();
  // 4) Send filePath of images to the req.body.images by using array
  req.body.post_images = [];

  /* 5) Loop through the images, resize them and push them onto the array
  Promise all the array so that the code doesn't go to next immediately */
  await Promise.all(
    req.files.post_images.map(async (file, i) => {
      const fileName = `post-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/images/posts/${fileName}`);

      req.body.post_images.push(fileName);
    })
  );

  next();
});

/* Checking if category is valid */
exports.categoryExists = catchAsync(async (req, res, next) => {
  // Check if given post_category exists in the category collections
  const categoryExists = await Category.findById(req.body.post_category);

  if (!categoryExists) {
    return res.status(400).json({
      status: "fail",
      message: "The given post_category is not valid",
    });
  }

  next();
});

/* ==============================
   ========CRUD OPERATION========
   ============================== */

exports.getAllPosts = catchAsync(async (req, res) => {
  const features = new APIFeatures(Post.find(), req.query)
    .filter()
    .search()
    .sort()
    .limitFields()
    .pagination();

  const posts = await features.query;

  if (posts.length <= 0) throw new APPError("No posts were found.", 404);

  // Send JSON
  res.status(200).json({
    status: "success",
    results: posts.length,
    data: {
      posts,
    },
  });
});

exports.getPostByCategory = catchAsync(async (req, res) => {
  // 1) Get PostByCategory Using the given CategoryID
  const features = new APIFeatures(
    Post.find({ post_category: req.params.catID }),
    req.query
  )
    .filter()
    .search()
    .sort()
    .limitFields()
    .pagination();
  const postByCategory = await features.query;

  // 2) Check if there is Post if not throw error
  if (!postByCategory || postByCategory.length <= 0)
    throw new APPError("No post found in this category...", 404);

  // 3) Send JSON
  res.status(200).json({
    status: "success",
    result: `Found ${postByCategory.length} Post(s) in this category`,
    data: postByCategory,
  });
});

exports.getPost = catchAsync(async (req, res) => {
  // 1) Get Post with postID
  const post = await Post.findById(req.params.postID).populate("reviews");

  // 2) Check if Post exists if not throw error
  if (!post || post.length <= 0) throw new APPError("No post found...", 404);

  // 3) Send JSON
  res.status(200).json({
    status: "success",
    result: "Found",
    data: {
      post,
    },
  });
});

exports.createPost = catchAsync(async (req, res) => {
  // 1) Create Post
  const newPost = await Post.create(req.body);
  // 2) Validation already performed by mongoose in the Schema

  // 3) Check if post went through
  if (!newPost) throw new APPError("Can't create post", 400);

  // 4) Send JSON
  res.status(201).json({
    status: "success",
    result: "Created",
    data: {
      post: newPost,
    },
  });
});

exports.updatePost = catchAsync(async (req, res) => {
  // 1) Find the post to be updated
  const post = await Post.findById(req.params.postID);

  // 2) Delete old images
  if (req.body.post_imageCover || req.body.post_images) {
    const oldImages = [];
    if (req.body.post_imageCover) {
      oldImages.push(post.post_imageCover);
    }

    if (req.body.post_images) {
      post.post_images.forEach((image) => oldImages.push(image));
    }

    oldImages.forEach((image) => {
      fs.unlinkSync(`public/images/posts/${image}`);
    });
  }

  // 3) Update Post and run validators using the options
  const updatePost = await Post.findByIdAndUpdate(req.params.postID, req.body, {
    new: true,
    runValidators: true,
  });

  // 4) Check if post was updated or not
  if (!updatePost) throw new APPError("File not found", 404);

  // 4) Send JSON
  res.status(200).json({
    status: "success",
    result: "Updated",
    data: {
      updatedPost: updatePost,
    },
  });
});

exports.deletePost = catchAsync(async (req, res) => {
  // 1) Find the post to be deleted
  const post = await Post.findById(req.params.postID);
  if (!post) throw new APPError("File not found.", 404);

  // 2) Delete old images
  if (post.post_imageCover || post.post_images) {
    const oldImages = [];
    oldImages.push(post.post_imageCover);
    if (post.post_images) {
      post.post_images.forEach((image) => oldImages.push(image));
    }

    oldImages.forEach((image) => {
      fs.unlinkSync(`public/images/posts/${image}`);
    });
  }

  // 3) Delete Post with given postID
  const deletePost = await Post.findByIdAndDelete(req.params.postID);
  const deleteReview = await Reveiw.deleteMany({ postID: req.params.postID });

  // 4) Check if post was deleted or not
  if (!deletePost) throw new APPError("File not found", 404);

  // 5) Send JSON
  res.status(204).json({
    status: "success",
    result: "Deleted",
  });
});
