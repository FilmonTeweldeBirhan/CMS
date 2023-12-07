const path = require("path");
const express = require("express");
const morgan = require("morgan");
const postsRouter = require("./routes/postsRoutes");
const categoryRouter = require("./routes/categoryRoutes");
const userRouter = require("./routes/userRoutes");
const globalErrorHandler = require("./controllers/errorController");
const APPError = require("./utils/appError");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();

/* =========== SETTING UP PUG  =========== */
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Parsing bodys
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

// Serving Static Files
app.use(express.static(path.join(__dirname, "public")));

// Use morgan only in dev Mode!
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* =========== SESSION SETUP  =========== */
const sessionStore = MongoStore.create({
  mongoUrl: process.env.DATABASE_LOCAL,
  collectionName: "sessions",
});

const options = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
};

if (app.get("env") === "production") {
  options.cookie.secure = true;
}

app.use(session(options));

/* =========== PASSPORT AUTHENTICATION  =========== */
// Need to require the passport configuration
require("./controllers/passportConfig/passport");

// Helps to keep persistance session in database
app.use(passport.initialize());
app.use(passport.session());

// trying
app.use((req, res, next) => {
  // console.log("SESSION:", req.session);
  // console.log("USER:", req.user);
  console.log("isAuthenticated:", req.isAuthenticated());

  next();
});

/* =========== ROUTES  =========== */
app.use("/api/v1/posts", postsRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);

/* =========== Error Handleres  =========== */
app.use((req, res, next) => {
  next(new APPError(`Can't ${req.method} ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
