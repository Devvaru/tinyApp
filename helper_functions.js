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

// checks whether email already exists
const getUserByEmail = function(email, users) {
  let user;

  for (const user_id in users) {
    if (users[user_id].email === email) {
      user = users[user_id];
      return user;
    }
  }
  return null;
};

// checks whether login and register fields are filled out properly
const formValidation = function(email, password) {
  if ((!email || !password) || email.length < 1 || password.length < 1) {
    return false;
  }
  return true;
};

// checks whether a user has urls and returns the urls
const urlsForUser = function(id, urlDatabase) {
  let urls = {};
  for (let urlID in urlDatabase) {
    if (urlDatabase[urlID].userID === id) {
      urls[urlID] = {longURL: urlDatabase[urlID].longURL, userID: urlDatabase[urlID].userID};
    }
  }
  return urls;
};

module.exports = { generateRandomString, getUserByEmail, formValidation, urlsForUser };