const router = require("express").Router();
const {
  getAllPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getPostByCategory,
} = require("./../controllers/postController");

/* =======================
    /api/v1/posts/
   /api/v1/posts/:postID  
   /api/v1/posts/category/:catID
   ======================= */

// Get All Posts OR Create a new Post
router.route("/").get(getAllPosts).post(createPost);

// Get PostByCategory
router.get("/category/:catID", getPostByCategory);

// Get Post OR Update Post OR Delete a Post
router.route("/:postID").get(getPost).patch(updatePost).delete(deletePost);

module.exports = router;
