const express = require("express");
const { generateRandomString, getUserByEmail, formValidation, urlsForUser } = require("./helpers");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080

// set ejs as the view engine
app.set("view engine", "ejs");
// body parser library - parses post body into a string
app.use(express.urlencoded({ extended: true }));
// cookie session - creates and encrypts cookies
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// displays current port in terminal to prevent confusion
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
};

const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "user@example.com",
    password: "1234",
  },
  g6Ymc8: {
    id: "g6Ymc8",
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
  if (!loggedIn) {
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

app.post("/urls", (req, res) => {
  if (!loggedIn) {
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

  const user_id = req.session.user_id;
  const urls = urlsForUser(user_id, urlDatabase);
  console.log(urls)

  res.redirect(`/urls/${urlID}`); // Redirects to new page for longURL and shortURL
});

// render new url form
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id], // display user on this page
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
  if (!loggedIn) {
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
  const longURL = urlDatabase[shortURL].longURL;
  if (!longURL) {
    res.status(404).send("The ID you entered does not exist");
  }
  res.redirect(longURL);
});

// delete urls with button
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const userURLs = urlsForUser(shortURL, urlDatabase);

  if (!urlDatabase[shortURL]) {
    res.status(404).send("The ID you entered does not exist");
    return;
  }

  if (!loggedIn) {
    res.status(403).send("Please log in to proceed");
    return;
  }

  if (!shortURL in userURLs) {
    res.status(403).send("Access Denied");
    return;
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// updates urls with button
app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  const userURLs = urlsForUser(shortURL, urlDatabase);

  if (!urlDatabase[shortURL]) {
    res.status(404).send("The ID you entered does not exist");
    return;
  }

  if (!loggedIn) {
    res.status(403).send("Please log in to proceed");
    return;
  }

  if (!shortURL in userURLs) {
    res.status(403).send("Access Denied");
    return;
  }

  urlDatabase[shortURL].longURL = longURL;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id], // display user on this page
  };

  if (loggedIn) {
    res.redirect("/urls");
  } else {
    res.render("registration", templateVars);
  }
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

  loggedIn = true;
  req.session.user_id = userID; // create user_id cookie based on user ID
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id], // display user on this page
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
  const user = getUserByEmail(email, users);
  const passwordIsValid = bcrypt.compareSync(password, user.password); // returns true if valid

  if (!formValidation(email, password)) { // email and password fields must have correct content
    res.status(400).send("Please fill out all fields");
    return;
  }

  if (!getUserByEmail(email, users)) { // prevents multiple registrations under an email
    res.status(403).send("There are no accounts under this email, please register");
    return;
  } else {
    const user = getUserByEmail(email, users);
    const userID = user.id;
    req.session.user_id = userID; // create user_id cookie based on user ID
  }

  if (!passwordIsValid) { // checks for correct password
    res.status(403).send("Incorrect password");
    return;
  }

  loggedIn = true;
  res.redirect("/urls");
});

// Logout, removes user_id cookie
app.post("/logout", (req, res) => {
  loggedIn = false;
  req.session = null;
  res.redirect("/login");
});