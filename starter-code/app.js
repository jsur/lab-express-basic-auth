const express        = require("express");
const session        = require('express-session');
const MongoStore     = require("connect-mongo")(session);
const path           = require("path");
const morgan         = require("morgan");
const cookieParser   = require("cookie-parser");
const bodyParser     = require("body-parser");
const mongoose       = require("mongoose");
const app            = express();
const expressLayouts = require('express-ejs-layouts');
const fs             = require('fs');

app.use(session({
  secret: "basic-auth-secret",
  cookie: { maxAge: 60000 },
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 24 * 60 * 60 // 1 day
  })
}));

// Controllers
const index = require('./routes/index');
const auth = require('./routes/auth-routes');

// Mongoose configuration
mongoose.connect("mongodb://localhost:27017/basic-auth");

// Logging
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log/access.log'), {flags: 'a'})
app.use(morgan('dev', {stream: accessLogStream}));

// View engine configuration
app.use(expressLayouts);
app.set('layout', 'layouts/_main');
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Access POST params with body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Authentication
app.use(cookieParser());

// Routes
app.use('/', index);
app.use('/', auth);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
