const fs = require("fs");
const User = require("./../models/userModel");
const APPError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const multer = require("multer");
const sharp = require("sharp");
const passport = require("passport");
const ObjFilterer = require("./../utils/ObjFilterer");
const Email = require("./../utils/email");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image"))
    return cb(new APPError("Invalid file, please use images only", 400), false);

  cb(null, true);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserImage = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.body.photo = `user-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/images/users/${req.body.photo}`);

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if the given role(s) match the user's role
    if (!roles.includes(req.user.role)) {
      return next(
        new APPError("You don't have permission to perform this action", 403)
      );
    }

    next();
  };
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, photo } = req.body;
  // Mongoose will validate our fields
  // So we just have to create new document in the database
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    photo,
  });

  const URL = `${req.protocol}://${req.get("host")}/me`;

  await new Email(newUser, URL).sendWelcome();

  res.status(201).json({
    status: "success",
    result: "Welcome...",
    data: {
      newUser,
    },
  });
});

exports.login = passport.authenticate("local", {
  successRedirect: "/api/v1/users/success",
  failureRedirect: "/api/v1/users/error",
  failureMessage: true,
});

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(new APPError(err.message, 500));
    res.redirect("/api/v1/posts");
  });
};

exports.getMe = catchAsync(async (req, res, next) => {
  // Get the user from req.user(passport)
  const user = req.user;

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // Get the user info
  const userFile = await User.findById(req.user.id);

  // Delete User's old photo if the user gives in new photo
  if (req.body.photo) {
    fs.unlinkSync(`public/images/users/${userFile.photo}`);
  }

  // 1) First check if the user didn't submit password to be updated
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new APPError(
        `Can't update your password here, for the please checkout this link ${
          req.protocol
        }://${req.get("host")}/api/v1/users/updateMyPassword`
      )
    );
  }

  // 2) Sanitize the req.body
  const filteredObj = ObjFilterer(req.body, "name", "email", "photo");

  // 3) Update the user data with given fields
  const updatedUserData = await User.findByIdAndUpdate(
    req.user.id,
    filteredObj,
    {
      new: true,
      runValidators: true,
    }
  );

  // 4) Send JSON
  res.status(200).json({
    status: "success",
    result: "Updated user data successfully",
    data: updatedUserData,
  });
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  // 1) Check if the user gave currPwd, newPwd, newPwdConfirm;
  const { password, newPassword, newPasswordConfirm } = req.body;
  if (!password || !newPassword || !newPasswordConfirm) {
    return next(new APPError("fill out all the fields", 400));
  }

  // 2) Get the logged in user's info
  const user = await User.findById(req.user.id).select("+password");

  // 3) Check if the currentPassword given is valid with DB's userPwd
  if (!(await user.correctPassword(password, user.password))) {
    return next(
      new APPError("Your current password is invalid, please try again", 401)
    );
  }

  // 4) Then update password using the given new password
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  // save it to DB
  await user.save();

  // 5) Logout the user(bc the pwd is changed)!
  this.logout(req, res, next);
});

exports.deleteMyAccount = catchAsync(async (req, res, next) => {
  // 1) Check if user gave his/her currpwd as form of consent
  if (!req.body.password)
    return next(new APPError("Please fill out the password field", 400));

  // 2) Get the current user's info from DB
  const user = await User.findById(req.user.id).select("+password");

  // 3) Check if currPwd match with the DB!
  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(new APPError("Incorrect password, please try again", 401));
  }

  // 4) Unlink the current user's photo
  if (user.photo !== "avatar.png") {
    fs.unlinkSync(`public/images/users/${user.photo}`);
  }

  // 5) Delete the current user from the database
  await User.findByIdAndDelete(req.user.id);

  // 6) Send Headers
  res.status(204).json();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Check if the user gave an email
  if (!req.body.email)
    return next(new APPError("Please provide an email adress", 400));

  // 2) Get the user who says alledgedly forgot my ass information Based on email
  const user = await User.findOne({ email: req.body.email });

  // 3) Check if there is user with that email exists
  if (!user) return next(new APPError("There is no user with that email", 404));

  // 4) Get generated token
  const reseterToken = user.createPwdRester();
  // then save it to DB
  await user.save({ validateBeforeSave: false });

  // Trycatch to catch errors
  try {
    // 5) Create URL
    const resetURL = `${req.protocol}://${req.get("host")}/resetPassword`;

    // 6) Send the user and URL to the email handler utils
    await new Email(user, resetURL, reseterToken).sendResetPwd();

    // 7) Send JSON
    res.status(200).json({
      status: "success",
      message: "reset Token was sent to your email successfully.",
    });
  } catch (err) {
    // If something went wrong set all reseters to undefined.
    user.passwordRester = undefined;
    user.passwordResterExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new APPError(
        "There was an error when trying to send the email, please try agian",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  /* 1) Check if the user has put the resetToken in field */
  const resetToken = req.body.resetToken;
  if (!resetToken)
    return next(
      new APPError(
        "Please put the reseterToken that you got from your email.",
        400
      )
    );

  /* 2) Get the user based on the passwordRester 
        and check the expirtation time */
  const user = await User.findOne({
    passwordRester: resetToken,
    passwordResterExpires: { $gt: Date.now() },
  });

  /* 3) Check if token is invalid(Expired) or valid */
  if (!user)
    return next(
      new APPError("Your resterToken is invalid or has already expired", 400)
    );

  /* 4) If all pass reset the password like a gentleman */
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordRester = undefined;
  user.passwordResterExpires = undefined;

  // then save it to DB
  await user.save();

  /* 5) redirect to the login */
  res.status(200).json({
    status: "success",
    message:
      "Your password has been updated successfully, you can login with your new password.",
  });
});
