const router = require("express").Router();
const {
  getAllPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} = require("./../controllers/postController");

/* =======================
    /api/v1/posts/
   /api/v1/posts/:postID  
   ======================= */

// Get All Posts OR Create a new Post
router.route("/").get(getAllPosts).post(createPost);

// Get Post OR Update Post OR Delete a Post
router.route("/:postID").get(getPost).patch(updatePost).delete(deletePost);

module.exports = router;
