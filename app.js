require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/quizUser', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = new mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
  // res.redirect('/');
});

app.post('/register', (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newUser = new User({
      email: req.body.email,
      password: hash
    });
    newUser.save((err) => {
      if (err) {
        console.log(err);
      } else {
        res.sendFile(__dirname + "/index.html")
      }
    });
  });
});

app.post('/login', (req, res) => {
  User.findOne({email: req.body.email}, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
        if(result===true){
        res.sendFile(__dirname + "/quiz.html");
      } else {
         console.log("user not found");
      }
      });


    }
  });
});

app.listen(3000, () => {
  console.log("Server is started at port 3000");
});
