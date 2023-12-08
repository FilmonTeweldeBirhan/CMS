const router = require("express").Router();
const { isAuth } = require("../utils/authMiddleware");
const {
  getAllPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getPostByCategory,
  uploadPostImage,
  resizeImage,
} = require("./../controllers/postController");
const { restrictTo } = require("./../controllers/userController");

const reviewRouter = require("./reviewRoutes");

/* =======================
    /api/v1/posts/
   /api/v1/posts/:postID  
   /api/v1/posts/category/:catID
   ======================= */

// Get All Posts OR Create a new Post
router
  .route("/")
  .get(getAllPosts)
  .post(isAuth, restrictTo("admin"), uploadPostImage, resizeImage, createPost);

// Get PostByCategory
router.get("/category/:catID", getPostByCategory);

// Get Post OR Update Post OR Delete a Post
router
  .route("/:postID")
  .get(getPost)
  .patch(isAuth, restrictTo("admin"), uploadPostImage, resizeImage, updatePost)
  .delete(isAuth, restrictTo("admin"), deletePost);

// Mount to review /posts/:postID/reviews
router.use("/:postID/reviews", reviewRouter);

module.exports = router;
