const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    category_name: {
      type: String,
      required: [true, "A Category must have a name"],
      minlength: [3, "A Category must have at least have 3 characters"],
      maxlength: [55, "A Category must have at most 55 characters"],
      unique: true,
      trim: true,
    },
    //   category_description: {
    //     type: String,
    //     trim: true,
    //   }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Category = mongoose.model("category", categorySchema);

module.exports = Category;
