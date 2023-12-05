const APPError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const APIFeatures = require("./../utils/apiFeatures");

const Category = require("./../models/categoryModel");

// Limits the number of categories
exports.limitCategory = (req, res, next) => {
  req.query.limit = "4";
  req.query.sort = "category_name";

  next();
};

/* ==============================
   ========CRUD OPERATION========
   ============================== */

exports.getAllCategories = catchAsync(async (req, res) => {
  // 1) Send it to the APIFeatures
  const features = new APIFeatures(
    Category.find({ category_name: { $regex: req.query.search } }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .pagination();

  const categories = await features.query;

  // 2) Check if there are any categories
  if (!categories) throw new APPError("No files found", 404);

  // 3) Send JSON
  res.status(200).json({
    status: "success",
    results: categories.length,
    data: {
      categories,
    },
  });
});

exports.getCategory = catchAsync(async (req, res) => {
  // 1) Get Category with given catID
  const category = await Category.findById(req.params.catID);

  // 1) Check if there is a category
  if (!category) throw new APPError("No file found", 404);

  // 3) Send JSON
  res.status(200).json({
    status: "success",
    results: "Found",
    data: {
      category,
    },
  });
});

exports.createCategory = catchAsync(async (req, res) => {
  // 1) Create Category
  const newCategory = await Category.create(req.body);
  // 2) Validation already performed by mongoose in the Schema

  // 3) Check if category went through
  if (!newCategory) throw new APPError("Can't create category", 400);

  // 4) Send JSON
  res.status(201).json({
    status: "success",
    result: "Created",
    data: {
      newCategory,
    },
  });
});

exports.updateCategory = catchAsync(async (req, res) => {
  // 1) Update Category and run validators using the options
  const updateCategory = await Category.findByIdAndUpdate(
    req.params.catID,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  // 2) Check if category was updated or not
  if (!updateCategory) throw new APPError("File not found", 404);

  // 3) Send JSON
  res.status(200).json({
    status: "success",
    result: "Updated",
    data: {
      updatedCategory: updateCategory,
    },
  });
});

exports.deleteCategory = catchAsync(async (req, res) => {
  // 1) Delete Category with given catID
  const deleteCategory = await Category.findByIdAndDelete(req.params.catID);

  // 2) Check if category was deleted or not
  if (!deleteCategory) throw new APPError("File not found", 404);

  // 3) Send JSON
  res.status(204).json({
    status: "success",
    result: "Deleted",
  });
});
