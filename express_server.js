const express = require("express");
const { generateRandomString, getUserByEmail, getPasswordByEmail, formValidation } = require("./helper_functions");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

// set ejs as the view engine
app.set("view engine", "ejs");
// body parser library - parses post body into a string
app.use(express.urlencoded({ extended: true }));
// cookie parser - parses cookie, accessable with res.cookies
app.use(cookieParser());

// displays current port in terminal to prevent confusion
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

let loggedIn = false; // toggle logged in state

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// render list of long urls with their short urls
app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!loggedIn) {
    res.status(403).send("Please log in to proceed");
    return;
  }
  const id = generateRandomString();
  const longURL = req.body.longURL; // save longURL from submissions
  urlDatabase[id] = longURL; // store id and longURL in urlDatabase
  res.redirect(`/urls/${id}`); // Redirects to new page for longURL and shortURL
});

// render new url form
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]], // display user on this page
    urls: urlDatabase
  };

  if (!loggedIn) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

// render individual pages for each url, accessed by its short url
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

// redirects to the long url based on the short url as a parameter. i.e.http://localhost:8080/u/b2xVn2
app.get("/u/:id", (req, res) => {
  const paramsID = req.params.id;
  const longURL = urlDatabase[paramsID];
  if (!longURL) {
    res.send("The ID you entered does not exist");
  }
  res.redirect(longURL);
});

// delete urls with button
app.post("/urls/:id/delete", (req, res) => {
  const paramsID = req.params.id;
  delete urlDatabase[paramsID];
  res.redirect("/urls");
});

// updates urls with button
app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]], // display user on this page
  };

  if (loggedIn) {
    res.redirect("/urls");
  } else {
    res.render("registration", templateVars);
  }
});

// registers email and password in users object
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (getUserByEmail(email, users)) { // prevents multiple registrations under an email
    res.status(400).send("This email is already registered");
    return;
  }

  if (!formValidation(email, password)) { // email and password fields must correct have content
    res.status(400).send("Please fill out all fields");
    return;
  }

  users[id] = {
    id,
    email,
    password
  };

  loggedIn = true;
  res.cookie('user_id', id); // create user_id cookie based on user ID
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]], // display user on this page
  };

  if (loggedIn) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});

// login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!formValidation(email, password)) { // email and password fields must correct have content
    res.status(400).send("Please fill out all fields");
    return;
  }

  if (!getUserByEmail(email, users)) { // prevents multiple registrations under an email
    res.status(403).send("There are no accounts under this email, please register");
    return;
  } else {
    const user = getUserByEmail(email, users);
    const userId = user.id;
    res.cookie('user_id', userId); // create user_id cookie based on user ID
  }

  if (!getPasswordByEmail(users, email, password)) { // checks for correct password
    res.status(403).send("Incorrect password");
    return;
  }

  loggedIn = true;
  res.redirect("/urls");
});

// Logout, removes user_id cookie
app.post("/logout", (req, res) => {
  loggedIn = false;
  res.clearCookie('user_id');
  res.redirect("/login");
});