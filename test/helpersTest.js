const { assert } = require('chai');

const { getUserByEmail, formValidation, urlsForUser } = require('../helpers.js');

const testUsers = {
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
};

const testUrlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.deepEqual(user.id, expectedUserID);
  });

  it('should return undefined with invalid email', function() {
    const user = getUserByEmail("user23@example.com", testUsers);
    assert.deepEqual(user, undefined);
  });
});

describe('formValidation', function() {
  it('should return true if the form is filled out properly', function() {
    const validation = (formValidation("userabc@example.com", "abc123"));
    assert.equal(validation, true);
  });

  it('should return false if the email field is not filled out properly', function() {
    const validation = (formValidation("", "abc123"));
    assert.equal(validation, false);
  });

  it('should return false if the password field is not filled out properly', function() {
    const validation = (formValidation("userabc@example.com", ""));
    assert.equal(validation, false);
  });
});

describe('urlsForUser', function() {
  it('should return the urls of a user if the user exists', function() {
    const urls = urlsForUser("userRandomID", testUrlDatabase);
    const expectedURLs = {
      "b2xVn2": {
        longURL: "http://www.lighthouselabs.ca",
        userID: "userRandomID"
      },
      "9sm5xK": {
        longURL: "http://www.google.com",
        userID: "userRandomID"
      }
    };
    assert.deepEqual(urls, expectedURLs);
  });

  it('should return an empty object if the user does not have urls', function() {
    const urls = urlsForUser("user2RandomID", testUrlDatabase);
    const expectedURLs = {};
    assert.deepEqual(urls, expectedURLs);
  });

  it('should return an empty object if the user does not exist', function() {
    const urls = urlsForUser("user4RandomID", testUrlDatabase);
    const expectedURLs = {};
    assert.deepEqual(urls, expectedURLs);
  });
});