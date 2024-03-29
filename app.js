//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');  //for only hash security 
// const bcrypt = require('bcrypt');
// const saltRounds = 5;
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const app = express();


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little kaustubh",
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://auth:test123456@cluster0.jlc5g.mongodb.net/Auth", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err) => {
  if (!err) {
    console.log("u are connected with mongoose");
  } else {
    console.log("u r failed " + err);
  }
});



//userSchema

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt,{ secret: process.env.SECRET, encryptedFields:["password"]});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function (accessToken, refreshToken, profile, cb) {
    
    User.findOrCreate({
      username:profile.emails[0].value , googleId: profile.id ,
    }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function (req, res) {
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['email','profile']
  }));

app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function (req, res) {
  res.render("login");
});


app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
})
// app.post("/register", function (req, res) {

//   bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
//     const newUser = new User({
//       email: req.body.username,
//       password: hash
//     });
//     newUser.save(function (err) {
//       if (err) {
//         console.log('kaustubh ki wajah sai' + err);
//       } else {
//         res.render("secrets");
//       }
//     });
//   });
// });

// app.post("/login", function (req, res) {
//   const username = req.body.username;
//   const password = req.body.password;
//   User.findOne({
//     email: username
//   }, function (err, result) {
//     if (err) {
//       console.log('kaustubh ki wajah sai' + err);
//     } else {
//       bcrypt.compare(password, result.password, function(err, results) {
//         if (results === true) {
//           res.render('secrets')
//         }
//     });
//     }
//   })
// })
app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.post("/register", function (req, res) {
  User.register({
    username:req.body.username
  }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect('/register');
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect('/secrets');
      })
    }
  })
});

app.post("/login", function (req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect('/secrets');
      })
    }
  })
})

app.listen(3000, function () {
  console.log("Premnotes Server is Started at port 3000");
})