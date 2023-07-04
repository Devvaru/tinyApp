const express = require("express");
const { generateRandomString, isLoggedIn, getUserByEmail, formValidation, urlsForUser } = require("./helpers");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // set ejs as the view engine
app.use(express.urlencoded({ extended: true })); // body parser library - parses post body into a string
app.use(cookieSession({ // cookie session - creates and encrypts cookies
  name: 'session',
  keys: ['key1', 'key2']
}));

// displays current port in terminal to prevent confusion
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const urlDatabase = {};
const users = {};

app.get("/", (req, res) => {
  if (!isLoggedIn(req)) {
    res.redirect('/login');
  }
  res.redirect('/urls');
});

// render list of long urls with their short urls
app.get("/urls", (req, res) => {
  if (!isLoggedIn(req)) {
    res.status(403).send("Please log in to view URLs");
    return;
  }

  const userID = req.session.user_id;
  const userURLs = urlsForUser(userID, urlDatabase);
  const templateVars = {
    user: users[req.session.user_id],
    urls: userURLs
  };

  res.render("urls_index", templateVars);
});

// generate new shortURL object
app.post("/urls", (req, res) => {
  if (!isLoggedIn(req)) {
    res.status(403).send("Please log in to proceed");
    return;
  }

  const urlID = generateRandomString();
  const longURL = req.body.longURL; // save longURL from submissions
  const userID = req.session.user_id; // get userID from cookie
  const newUrlObj = {}; // new url object to add to urlDatabase

  newUrlObj.longURL = longURL; // store longURL in urlDatabase
  newUrlObj.userID = userID; // store userID with created url
  urlDatabase[urlID] = newUrlObj; // add new url object to urlDatabase

  res.redirect(`/urls/${urlID}`); // Redirects to new page for longURL and shortURL
});

// render new url form
app.get("/urls/new", (req, res) => {
  if (!isLoggedIn(req)) {
    res.redirect("/login");
    return;
  }

  const templateVars = {
    user: users[req.session.user_id], // display user on this page
    urls: urlDatabase
  };

  res.render("urls_new", templateVars);
});

// render individual pages for each url, accessed by its short url
app.get("/urls/:id", (req, res) => {
  if (!isLoggedIn(req)) {
    res.status(403).send("Please log in to proceed");
    return;
  }

  const userID = req.session.user_id;
  const urls = urlsForUser(userID, urlDatabase);
  const urlID = req.params.id;
  if (!(urlID in urls)) {
    res.status(403).send("This URL can only be accessed by its creator");
    return;
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.user_id]
  };

  res.render("urls_show", templateVars);
});

// redirects to the long url based on the short url as a parameter. i.e.http://localhost:8080/u/b2xVn2
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
    res.status(404).send("The ID you entered does not exist");
    return;
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// deletes urls with button
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;

  if (!urlDatabase[shortURL]) {
    res.status(404).send("The ID you entered does not exist");
    return;
  }

  if (!isLoggedIn(req)) {
    res.status(403).send("Please log in to proceed");
    return;
  }

  const userID = req.session.user_id;
  const userURLs = urlsForUser(userID, urlDatabase);

  if (!(shortURL in userURLs)) {
    res.status(403).send("Access Denied");
    return;
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// updates longURL
app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;

  if (!urlDatabase[shortURL]) {
    res.status(404).send("The ID you entered does not exist");
    return;
  }

  if (!isLoggedIn(req)) {
    res.status(403).send("Please log in to proceed");
    return;
  }

  const userID = req.session.user_id;
  const userURLs = urlsForUser(userID, urlDatabase);

  if (!(shortURL in userURLs)) {
    res.status(403).send("Access Denied");
    return;
  }

  urlDatabase[shortURL].longURL = longURL;
  res.redirect("/urls");
});

// render registration page
app.get("/register", (req, res) => {
  if (isLoggedIn(req)) {
    res.redirect("/urls");
    return;
  }

  const templateVars = {
    user: users[req.session.user_id], // display user on this page
  };

  res.render("registration", templateVars);
});

// registers email and password in users object
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (getUserByEmail(email, users)) { // prevents multiple registrations under an email
    res.status(400).send("This email is already registered");
    return;
  }

  if (!formValidation(email, password)) { // email and password fields must have correct content
    res.status(400).send("Please fill out all fields");
    return;
  }

  users[userID] = {
    id: userID,
    email,
    password: hashedPassword
  };

  req.session.user_id = userID; // create user_id cookie based on user ID
  res.redirect("/urls");
});

// renders login page if not logged in
app.get("/login", (req, res) => {
  if (isLoggedIn(req)) {
    res.redirect("/urls");
    return;
  }

  const templateVars = {
    user: users[req.session.user_id], // display user on this page
  };

  res.render("login", templateVars);
});

// login form submission
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  
  if (!formValidation(email, password)) { // email and password fields must have correct content
    res.status(400).send("Please fill out all fields");
    return;
  }

  const passwordIsValid = bcrypt.compareSync(password, user.password); // returns true if valid

  if (!getUserByEmail(email, users)) { // prevents multiple registrations under an email
    res.status(403).send("There are no accounts under this email, please register");
    return;
  }

  if (!passwordIsValid) { // checks for correct password
    res.status(403).send("Incorrect password");
    return;
  }

  const userID = user.id;
  req.session.user_id = userID; // create user_id cookie based on user ID

  res.redirect("/urls");
});

// Logout, removes user_id cookie
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/login");
});