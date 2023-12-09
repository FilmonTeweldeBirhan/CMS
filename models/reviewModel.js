const mongoose = require("mongoose");
const Post = require("./postModel");
const dateUTC = require("./../utils/dateUTC");

const reviewSchema = new mongoose.Schema(
  {
    postID: {
      type: mongoose.Schema.ObjectId,
      ref: "post",
      required: [true, "A review must belong to a post."],
    },
    userID: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
      required: [true, "A review must have a user"],
    },
    review: {
      type: String,
      required: [true, "Review can't be empty"],
    },
    rating: {
      type: Number,
      min: [1, "Rating can't be below 1"],
      max: [5, "Rating can't be above 5"],
    },
    createdAt: {
      type: Date,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* Create New Date for every newly Posted Review
   Item then save it post_dateCreated prop.  */
reviewSchema.pre("save", function (next) {
  this.createdAt = dateUTC();
  next();
});

/* Used unique index so no duplicate field happens */
reviewSchema.index({ postID: 1, userID: 1 }, { unique: true });

reviewSchema.statics.calculateRating = async function (postID) {
  // Calculating the reviews
  const stats = await this.aggregate([
    {
      $match: { postID },
    },
    {
      $group: {
        _id: "$postID",
        avgRating: { $avg: "$rating" },
        numReview: { $sum: 1 },
      },
    },
  ]);

  console.log(stats);

  // Set the averageRatings and ratingsQuantity in to the post
  if (stats.length > 0) {
    await Post.findByIdAndUpdate(postID, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].numReview,
    });
  } else {
    await Post.findByIdAndUpdate(postID, {
      ratingsAverage: 1,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.post("save", function () {
  this.constructor.calculateRating(this.postID);
});

/* The code below is not working so i decided to use it the old way! */
// reviewSchema.pre(/^findById/, async function (next) {
//   this.rev = this.findOne();
//   next();
// });

// reviewSchema.post(/^findById/, async function () {
//   await this.rev.constructor.calculateRating(this.rev.postID);
// });

const Review = mongoose.model("review", reviewSchema);

module.exports = Review;
