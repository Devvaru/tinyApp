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

// checks whether password entered is correct
const getPasswordByEmail = function(users, email, password) {
  for (const userId in users) {
    if (users[userId].email === email) {
      if (users[userId].password === password) {
        return true;
      }
    }
  }
  return false;
};

// checks whether login and register fields are filled out properly
const formValidation = function(email, password) {
  if ((!email || !password) || email.length < 1 || password.length < 1) {
    return false;
  }
  return true;
};

module.exports = { generateRandomString, getUserByEmail, getPasswordByEmail, formValidation };