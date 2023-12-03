const router = require("express").Router();
const {
  limitCategory,
  getAllCategories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("./../controllers/categoryController");

/* =======================
    /api/v1/categories/
   /api/v1/categories/:catID  
   ======================= */

// Get limited Categories for the Navbar
router.get("/navbar", limitCategory, getAllCategories);

// Get All Categories OR Create a new Category
router.route("/").get(getAllCategories).post(createCategory);

// Get Category OR Update Category OR Delete a Category
router
  .route("/:catID")
  .get(getCategory)
  .patch(updateCategory)
  .delete(deleteCategory);

module.exports = router;
