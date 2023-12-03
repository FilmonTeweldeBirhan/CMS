const router = require("express").Router();

/* =======================
    /api/v1/posts/
   /api/v1/posts/:postID  
   ======================= */
// Get All Posts
router.get("/", getAllPosts);

// Get Post
router.get("/:postID", getPost);

module.exports = router;
