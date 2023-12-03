const mongoose = require("mongoose");
// const moment = require("moment-timezone");

const postSchema = new mongoose.Schema(
  {
    post_title: {
      type: String,
      required: [true, "A Post must have a title"],
      trim: true,
      unique: true,
      maxlength: [255, "A Post should have at most 255 characters"],
      minlength: [3, "A Post should have at least 3 characters"],
    },
    post_category: {
      type: mongoose.Schema.ObjectId,
      ref: "category",
    },
    post_price: {
      type: Number,
      required: [true, "A Post must have a price"],
    },
    ratingsAverage: {
      type: Number,
      min: [1, "Rating must be between 1 and 5"],
      max: [5, "Rating must be between 1 and 5"],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: Number,
    post_summary: {
      type: String,
      required: [true, "A Post must have a summary"],
      trim: true,
    },
    post_description: {
      type: String,
      trim: true,
    },
    post_imageCover: {
      type: String,
      required: [true, "A Post must have an image cover"],
    },
    post_images: [String],
    post_dateCreated: {
      type: Date,
      default: new Date(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Used index to improve read performance!
postSchema.index({ post_category: 1, post_price: 1, ratingsAverage: -1 });

// Populate Category on every request with the find criteria
postSchema.pre(/^find/, function (next) {
  this.populate({
    path: "post_category",
    select: "category_name",
  });
  next();
});

const Post = mongoose.model("post", postSchema);

module.exports = Post;
