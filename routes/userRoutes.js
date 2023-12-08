const {
  uploadUserImage,
  resizeUserPhoto,
  signup,
  login,
  logout,
  getMe,
  updateMe,
  updateMyPassword,
  deleteMyAccount,
  forgotPassword,
  resetPassword,
  restrictTo,
  getAllUsers,
  getUser,
  deleteUser,
} = require("../controllers/userController");

const { isAuth, isNotAuth } = require("./../utils/authMiddleware");

// const passport = require("passport");

const router = require("express").Router();

router.post("/signup", uploadUserImage, resizeUserPhoto, signup);

router.post("/login", login);

router.get("/logout", logout);

router.patch("/forgotPassword", forgotPassword);

router.patch("/resetPassword", resetPassword);

router.use(isAuth);

router.get("/me", getMe);

router.patch("/updateMe", uploadUserImage, resizeUserPhoto, updateMe);

router.patch("/updateMyPassword", updateMyPassword);

router.delete("/deleteMyAccount", deleteMyAccount);

/* ===========message routes controllers================ */
router.get("/success", (req, res) => {
  res.status(200).json({
    status: "logged in",
  });
});

router.get("/error", (req, res) => {
  res.status(401).json({
    status: "Unautherized",
  });
});

// Only an admin can access routes from this point on!.
router.use(restrictTo("admin"));

router.get("/", getAllUsers);

router.route("/:userID").get(getUser).delete(deleteUser);

module.exports = router;
