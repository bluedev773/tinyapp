const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.set("view engine", "ejs");

//--------------------Data----------------------------------------------------
const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};
const users = { 
  "userRandomID": {
    id: "aJ48lW", 
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
  const currentID = req.session.user_id;
  const currentUser = users[currentID];
  const userUrls = getUrlsById(currentID);
  const templateVars = {
    urls: userUrls,
    user: currentUser
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const currentID = req.session.user_id;
  const currentUser = users[currentID];
  const templateVars = {
    user: currentUser
  };
  if(!currentUser) {
    res.redirect("/login");
  }
  console.log(currentUser);
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const currentID = req.session.user_id;
  const currentUser = users[currentID];
  const templateVars = {
    user: currentUser
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const currentID = req.session.user_id;
  const currentUser = users[currentID];
  const templateVars = {
    user: currentUser
  };
  res.render("urls_login", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const currentID = req.session.user_id;
  const currentUser = users[currentID];
  const usersURLs = getUrlsById(currentID);
  if(shortURL in usersURLs) {
    const templateVars = {
      shortURL: shortURL,
      longURL: urlDatabase[shortURL].longURL,
      user: currentUser
    }
    res.render("urls_show", templateVars);
  } else {
    res.send("This short URL does not exist for this User account.")
  }
  
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if(shortURL in urlDatabase) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.send("No such short URL exists");
  }
});

app.post("/urls", (req, res) => {
  const currentID = req.session.user_id;
  const currentUser = users[currentID];
  if(!currentUser) {
    res.send("Error: You need to be logged in to create a new URL.");
  } else {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL; 
    urlDatabase[shortURL] = {
      longURL: longURL,
      userID: currentID
    }
    console.log(urlDatabase);
    res.redirect(`/urls/${shortURL}`);         
  }
  
});

app.post("/urls/:shortURL", (req, res) => {
  const currentID = req.session.user_id;
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL; 
  const usersURLs = getUrlsById(currentID);
  if(shortURL in usersURLs)  {
    urlDatabase[shortURL] = {
      longURL: longURL,
      userID: currentID
    }
    res.redirect(`/urls/`);
  } else {
    res.send("Error: This URL is not associated with the current user account.");
  }

});

app.post("/urls/:shortURL/delete", (req, res) => {
  const currentID = req.session.user_id;
  const shortURL = req.params.shortURL;
  const usersURLs = getUrlsById(currentID);
  if(shortURL in usersURLs) {
    delete urlDatabase[shortURL];
    res.redirect(`/urls/`);
  } else {
    res.send("You do not have permission to delete this URL.");
  }
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  if(emailLookup(userEmail) !== true) {
    res.status(403);
    res.send("User with this email not found");
  } else if (!(bcrypt.compareSync(userPassword, passByEmail(userEmail)))) {
    res.status(403);
    res.send("Incorrect password");
  } else {
    const id = idByEmail(userEmail);
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(userPassword, 10);
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
        password: hashedPassword
      }
      req.session.user_id = userID;
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
  return null;
}

//return password of given email
const passByEmail = function (email) {
  for(const key in users) {
    if(email === users[key].email) {
      return users[key].password;
    }
  }
  return null;
}

//return id of given email
const idByEmail = function (email) {
  for(const key in users) {
    if(email === users[key].email) {
      return users[key].id;
    }
  }
  return null;
}

//return urls with matching userId
const getUrlsById = function(userId) {
  let urls = {};
  for(const key in urlDatabase) {
    if(urlDatabase[key].userID === userId) {
       urls[key] = urlDatabase[key];
    }
  }
  console.log(urls);
  return urls;
}