const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

//--------------------Data----------------------------------------------------
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

//----------------------------------Route Handlers----------------------------------

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const currentID = req.cookies["user_id"];
  const currentUser = users[currentID];
  console.log(currentUser);
  const templateVars = {
    urls: urlDatabase,
    user: currentUser
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const currentID = req.cookies["user_id"];
  const currentUser = users[currentID];
  const templateVars = {
    username: currentUser
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const currentID = req.cookies["user_id"];
  const currentUser = users[currentID];
  const templateVars = {
    user: currentUser
  };
  res.render("urls_register", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const currentID = req.cookies["user_id"];
  const currentUser = users[currentID];
  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL],
    user: currentUser
  }
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL; 
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);         
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls/`);
});

app.post("/login", (req, res) => {
  const userName = req.body.username;
  res.cookie("username", userName);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  if(userEmail === '' || userPassword === '') {
    res.status(400);
    res.send('email or password empty');
  } else if (emailLookup(userEmail) === true) {
      res.status(400);
      res.send('User exists already');
  } else {
      users[userID] = {
        id: userID,
        email: userEmail,
        password: userPassword
      }
      res.cookie("user_id", userID);
      res.redirect("/urls");
  }
  console.log(users);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//-----------------------Helper functions--------------------------

//generate string of 6 random alphanumeric characters
const generateRandomString = function() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

//return true if email exists in user object
const emailLookup = function (email) {
  for(const key in users) {
    if(email === users[key].email) {
      return true;
    }
  }
}