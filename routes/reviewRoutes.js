const router = require("express").Router({ mergeParams: true });
const {
  postExists,
  getAllReviewsWithInPosts,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} = require("./../controllers/reviewController");
const { isAuth } = require("./../utils/authMiddleware");
const { restrictTo } = require("./../controllers/userController");

/* Mounted from postsRoutes (/posts/:postID/reviews) */

/* /posts/:postID/reveiws */
router
  .route("/")
  .get(getAllReviewsWithInPosts)
  .post(isAuth, restrictTo("user"), postExists, createReview);

/* Only a logged in user can access routes from now on. */
router.use(isAuth);

/* /posts/:postID/reveiws/:reviewID */
router
  .route("/:reviewID/")
  .get(getReview)
  .patch(isAuth, updateReview)
  .delete(isAuth, deleteReview);

module.exports = router;
