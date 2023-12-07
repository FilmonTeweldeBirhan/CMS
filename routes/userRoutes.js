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
} = require("../controllers/userController");

const { isAuth, isNotAuth } = require("./../utils/authMiddleware");

// const passport = require("passport");

const router = require("express").Router();

router.post("/signup", uploadUserImage, resizeUserPhoto, signup);

router.post("/login", login);

router.get("/logout", logout);

router.get("/me", isAuth, getMe);

router.patch("/updateMe", isAuth, uploadUserImage, resizeUserPhoto, updateMe);

router.patch("/updateMyPassword", isAuth, updateMyPassword);

router.delete("/deleteMyAccount", isAuth, deleteMyAccount);

router.patch("/forgotPassword", forgotPassword);

router.patch("/resetPassword", resetPassword);

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

module.exports = router;
