const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

// set ejs as the view engine
app.set("view engine", "ejs");
// body parser library - parses post body into a string
app.use(express.urlencoded({ extended: true }));
// cookie parser - parses cookie, accessable with res.cookies
app.use(cookieParser());

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

app.get("/", (req, res) => {
  res.send("Hello!");
});

// render list of long urls with their short urls
app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"], // display username on this page
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// render new url form
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"], // display username on this page
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});

// render individual pages for each url, accessed by its short url
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    username: req.cookies["username"], // display username on this page
  };
  res.render("urls_registration", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL; // save longURL from submissions and generate id, store in urlDatabase
  console.log(urlDatabase);
  res.redirect(`/urls/${id}`); // Redirects to new page for longURL and shortURL
});

// delete urls with button
app.post("/urls/:id/delete", (req, res) => {
  const paramsID = req.params.id;
  delete urlDatabase[paramsID];
  console.log(urlDatabase);
  res.redirect("/urls");
});

// updates urls with button
app.post("/urls/:id/edit", (req, res) => {
  const templateVars = {
    username: req.cookies["username"] // display username on this page
  };
  res.render(templateVars);

  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

// login, saves username as cookie
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls");
});

// Logout, removes username cookie
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

// redirects to the long url based on the short url as a parameter. i.e.http://localhost:8080/u/b2xVn2
app.get("/u/:id", (req, res) => {
  const paramsID = req.params.id;
  const longURL = urlDatabase[paramsID];
  if (!longURL) {
    res.send("The URL you entered doesn't exist");
  }
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// displays current port in terminal to prevent confusion
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// generates ID with a length of 6
const generateRandomString = function() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomArray = [];

  for (let i = 0; randomArray.length < 6; i++) {
    const randomNum = Math.round((Math.random() * characters.length));
    randomArray.push(characters[randomNum]);
  }

  const randomString = randomArray.join('');
  return randomString;
};
