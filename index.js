require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// View engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/", require("./routes/web.route"));
app.use("/api", require("./routes/api.route"));

// Start server
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});