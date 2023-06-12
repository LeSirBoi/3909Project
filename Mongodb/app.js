// Note: MD5 solution is commented below

var express = require("express"),
  handlebars = require("express-handlebars").create({ defaultLayout: "main" }),
  cookieParser = require("cookie-parser"),
  sessions = require("express-session"),
  bodyParser = require("body-parser"),
  https = require("https"),
  fs = require("fs"),
  md5 = require("md5"),
  mongoose = require("mongoose"),
  credentials = require("./credentials"),
  Users = require("./models/uCredentials.js");
// load env variables
const dotenv = require("dotenv");
dotenv.config();

var app = express();
//db connection
mongoose
  .connect(process.env.MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log("DB Connected"));

mongoose.connection.on("error", (err) => {
  console.log(`DB connection error: ${err.message}`);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(credentials.cookieSecret));
app.use(
  sessions({
    resave: true,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    cookie: { maxAge: 3600000 },
  })
);

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");

app.set("port", process.env.PORT || 3100);

app.get("/", function (req, res) {
  res.render("login");
});

function checklogin(req, res, user, password) {
  Users.findOne({ uname: user, pass: password }, function (err, user) {
    //you need to complete the implementation of this function
    if (user) {
      req.session.userName = req.body.uname;
      res.redirect(303, "home");
    } else {
      res.render("login", {
        message:
          "Username or password do not match our records. Please try again or register if you are a new user!",
      });
    }
  });
}

app.post("/processLogin", function (req, res) {
  //Determine if user is registering
  if (req.body.buttonVar == "login") {
    checklogin(req, res, req.body.uname.trim(), req.body.pword.trim());
  } else {
    res.redirect(303, "register");
  }
});

app.post("/processReg", function (req, res) {
  //you need to implement this end point
  if (req.body.pword.trim() == req.body.pword2.trim()) {
    Users.find(function (err, users) {
      console.log("The number of users was", users.length);
      for (i = 0; i < users.length; i++) {
        console.log(users[i].uname);
        console.log(users[i].pass);
        console.log("\n");
      }
    });
    req.session.userName = req.body.uname;
    const user = new Users({
      uname: req.body.uname.trim(),
      pass: req.body.pword.trim(),
      // pass: md5(req.body.pword.trim())   This line encrypts the password using MD5 before saving it to the database.
    });
    user.save();
    res.redirect(303, "home");
  } else {
    res.render("register", { message: "Passwords did not match. Try again" });
  }
});

app.get("/home", function (req, res) {
  if (req.session.userName) {
    res.render("home");
  } else {
    res.render("login", { message: "Please login to access the home page" });
  }
});

app.get("/page2", function (req, res) {
  if (req.session.userName) {
    res.render("page2");
  } else {
    res.render("login", { message: "Please login to access the second page" });
  }
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/logout", function (req, res) {
  delete req.session.userName;
  res.redirect(303, "/");
});

app.listen(app.get("port"), function () {
  console.log(
    "Express started on http://localhost:" +
      app.get("port") +
      "; press Ctrl-C to terminate"
  );
});

process.on("unhandledRejection", (error) => {
  // Will print "unhandledRejection err is not defined"
  console.log("unhandledRejection", error.message);
});
