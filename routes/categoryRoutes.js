const router = require("express").Router();
const { restrictTo } = require("../controllers/userController");
const { isAuth } = require("../utils/authMiddleware");
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
   /api/v1/categories/navbar  
   ======================= */

// Get limited Categories for the Navbar
router.get("/navbar", limitCategory, getAllCategories);

// Get All Categories OR Create a new Category
router
  .route("/")
  .get(getAllCategories)
  .post(isAuth, restrictTo("admin"), createCategory);

// Get Category OR Update Category OR Delete a Category
router
  .route("/:catID")
  .get(getCategory)
  .patch(isAuth, restrictTo("admin"), updateCategory)
  .delete(isAuth, restrictTo("admin"), deleteCategory);

module.exports = router;
