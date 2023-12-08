const fs = require("fs");
const Review = require("./../models/reviewModel");
const APPError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const Post = require("../models/postModel");

exports.postExists = catchAsync(async (req, res, next) => {
  const postExists = await Post.findById(req.params.postID);
  if (!postExists)
    return next(new APPError(`Can't review a post that doesn't exit`, 400));

  next();
});

/* /posts/:postID/reviews */
exports.getAllReviewsWithInPosts = catchAsync(async (req, res, next) => {
  // 1) Get all Reviews from specified postID
  const reviews = await Review.find({ postID: req.params.postID });

  // 2) Check for errors
  if (!reviews) return next(new APPError("Something went wrong", 500));

  // 3) Check if there is review or not
  if (reviews.length <= 0) {
    return res.status(200).json({
      status: "success",
      message: "No reviews yet, be the first one...",
    });
  }

  // 4) Send JSON
  res.status(200).json({
    status: "success",
    result: `This post has ${reviews.length} reviews`,
    data: {
      reviews,
    },
  });
});

/* /posts/:postID/reviews/:reviewID */
exports.getReview = catchAsync(async (req, res, next) => {
  // 1) Get review from given postID
  const review = await Review.findOne({
    _id: req.params.reviewID,
    postID: req.params.postID,
  });

  // 2) Check if there is a review with the given postID & reviewID
  if (!review || review.length <= 0) {
    return res.status(200).json({
      status: "success",
      message: "No review found with the given parameters",
    });
  }

  // 3) Send JSON
  res.status(200).json({
    status: "success",
    result: "Found",
    review,
  });
});

/* /posts/:postID/reviews */
exports.createReview = catchAsync(async (req, res, next) => {
  // 1) Get the review & rating from body
  const newObj = { ...req.body };
  // 2) Add postID, userID
  newObj.postID = req.params.postID;
  newObj.userID = req.user.id;

  // 3) Create a new review
  const createdReview = await Review.create(newObj);

  // 4) Check for errors
  if (!createdReview) return next(new APPError("Can't create review", 400));

  // 5) Send JSON
  res.status(201).json({
    status: "success",
    result: "Review created successfully",
    createdReview,
  });
});

/* /posts/:postID/reveiws/:reviewID */
exports.updateReview = catchAsync(async (req, res, next) => {
  // 1) Get review by postID & userID
  const updatedReview = await Review.findOne({
    postID: req.params.postID,
    userID: req.user.id,
  });

  // 2) Check if the review is there with given parameter
  if (!updatedReview) return next(new APPError("Can't update review", 500));

  /* Saving it to the DB */
  updatedReview.review = req.body.review || updatedReview.review;
  updatedReview.rating = req.body.rating || updatedReview.rating;
  updatedReview.save();

  // calling calculateRating so that the review aggregations are updated
  Review.calculateRating(updatedReview.postID);

  // 3) Send JSON
  res.status(200).send({
    status: "success",
    result: "Review updated successfully",
    updatedReview,
  });
});

/* /posts/:postID/reveiws/:reviewID */
exports.deleteReview = catchAsync(async (req, res, next) => {
  // 1) Get Review by reviewID
  const deleteReview = await Review.findById(req.params.reviewID);

  // 2) Only owner of review OR admin can delete the review
  if (deleteReview.userID == req.user.id || req.user.role == "admin") {
    // 3) Then delete the review
    await deleteReview.deleteOne();
    // calling calculateRating so that the review aggregations are updated
    Review.calculateRating(deleteReview.postID);
    // 4) Send JSON
    return res.status(204).json({
      status: "success",
      message: "Review deleted successfully",
    });
  }

  // 5) Send error if code gets here
  res.status(403).json({
    status: "fail",
    message: "Can't delete this review.",
  });
});
