const path = require("path");
const express = require("express");
const morgan = require("morgan");
const postsRouter = require("./routes/postsRoutes");

const app = express();

// Parsing bodys
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

// Serving Static Files
app.use(express.static(path.join(__dirname, "public")));

// Use morgan only in dev Mode!
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/home", (req, res) => {
  res.send(`<h1>Yes I'M Here!</h1>`);
});

/* =========== ROUTES  =========== */
app.use("/api/v1/posts", postsRouter);

module.exports = app;
