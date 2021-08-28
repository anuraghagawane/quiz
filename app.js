require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport= require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.use(session({
  secret: 'This is my secret.',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/quizUser', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

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
    callbackURL: "http://localhost:3000/auth/google/quiz"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get("/register", (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

app.get('/quiz', function(req, res) {
// console.log("inside quiz route");
  if (req.isAuthenticated()) {

    res.sendFile(__dirname+ "/quiz.html");

  } else {

    res.redirect("/");

  }

});

app.post('/register', (req, res) => {
      User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
          console.log(err);
          res.redirect('/');
        }else{
          passport.authenticate('local')( req , res , function(){
            res.redirect('/quiz');
          });
        }
      });
});

app.post('/login', (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
      req.login(user, function(err){
        if(err){
          console.log(err);
          res.redirect('/');
        }else{
          passport.authenticate('local')( req , res , function(){
            res.redirect('/quiz');
          });
        }
      })
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/quiz',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/quiz');
  });

app.post('/logout', (req, res)=>{
  req.logout();
  res.redirect('/');
})

app.listen(3000, () => {
  console.log("Server is started at port 3000");
});
