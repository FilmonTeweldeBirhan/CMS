const catchAsync = require("./../utils/catchAsync");
const APPError = require("./../utils/appError");
const APIFeatures = require("./../utils/APIFeatures");

const Post = require("./../models/postModel");

/* ==============================
   ========CRUD OPERATION========
   ============================== */

exports.getAllPosts = catchAsync(async (req, res) => {
  const features = new APIFeatures(Post.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();

  const posts = await features.query;

  // Send JSON
  res.status(200).json({
    status: "success",
    results: posts.length,
    data: {
      posts,
    },
  });
});

exports.getPostByCategory = catchAsync(async (req, res) => {});

exports.getPost = catchAsync(async (req, res) => {
  // 1) Get Post with postID
  const post = await Post.findById(req.params.postID);

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
  // 1) Update Post and run validators using the options
  const updatePost = await Post.findByIdAndUpdate(req.params.postID, req.body, {
    new: true,
    runValidators: true,
  });

  // 2) Check if post was updated or not
  if (!updatePost) throw new APPError("File not found", 404);

  // 3) Send JSON
  res.status(200).json({
    status: "success",
    result: "Updated",
    data: {
      updatedPost: updatePost,
    },
  });
});

exports.deletePost = catchAsync(async (req, res) => {
  // 1) Delete Post with given postID
  const deletePost = await Post.findByIdAndDelete(req.params.postID);

  // 2) Check if post was deleted or not
  if (!deletePost) throw new APPError("File not found", 404);

  // 3) Send JSON
  res.status(204).json({
    status: "success",
    result: "Deleted",
  });
});
