  // required NPM libraries

const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.use(cookieSession({
    name: 'session',
    keys: ['freebird']
}));

  // settings

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

  // database

const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "a"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const urlDatabase = {
  "b2xVn2": {
    userId: "userRandomID",
    longURL: "http://www.lighthouselabs.ca"
  },

  "9sm5xK": {
    userId: "user2RandomID",
    longURL: "http://www.google.com"
  }
};

  // helper functions

function generateRandomNum(num) {
  let numberOfChars = num || 7;
  let shortURL = "";
  const allowedChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < numberOfChars; i++) {
    shortURL += allowedChar.charAt(Math.floor(Math.random() * allowedChar.length));
  };
  return shortURL;
};


function getURLsForUser(user_id) {
  const singleURLObj = {};
  for(let uniqueShortURL in urlDatabase) {
    const currentURL = urlDatabase[uniqueShortURL];
    if(currentURL.userId === user_id) {
      singleURLObj[uniqueShortURL] = currentURL;
    }
  };
  return singleURLObj;
};


function giveEmail(email) {
  for(let user in users) {
    const currentUser = users[user];
    if (currentUser.email === email) {
      return currentUser.email;
    }
  };
};

function giveId(email) {
  for(let user in users) {
    const currentUser = users[user];
    if (currentUser.email === email) {
      return currentUser.id;
    }
  };
};

function registerRouteResponse(email, password, randomId, response, request) {
  if (email === "" || password === "" ) {
    response.status(400).send("Fields can't be blank."); 
  } else if (giveEmail(email)) {
    response.status(400).send("Email must be unique.");   
  } else {
    let newUser = {
      id: randomId,
      email: email,
      hashedPassword: password
    };
    
    users[randomId] = newUser;
    request.session.user_id = randomId;
    response.redirect("urls");
  }
};

  //middleware

app.use((request, response, next) => {                        
  const user = users[request.session.user_id];
  response.locals.user = user;

  return next();
}); 


  // routes

app.get("/", (request, response) => {
  const templateVars = { "urls": urlDatabase };
  const user_id = request.session.user_id;

  if (users[user_id]) {
    response.render("urls_index", templateVars);
  } else { 
    response.redirect("register");
  }
});


app.get("/urls.json", (request, response) => {  
  response.json(urlDatabase);
});


app.get("/register", (request, response) => {
  const user_id = request.session.user_id;

  if (user_id) { 
    response.redirect("urls"); 
  } else { 
    response.render("urls_register");
  }
});


app.get("/login", (request, response) => {
  const user_id = request.session.user_id;

  if (users[user_id]) { 
    response.redirect("urls"); 
  } else { 
    response.render("urls_login");
  }
});


app.get("/urls", (request, response) => {
  const user_id = request.session.user_id;
  const templateVars = { "urls": getURLsForUser(user_id) };

  if (users[user_id]) {
    response.render("urls_index", templateVars);
  } else { 
    response.redirect("/login");
  };
});


app.get("/urls/new", (request, response) => {
  const user_id = request.session.user_id;

  if (users[user_id]) {
    response.render("urls_new");
  } else { 
    response.redirect("/login");
  };
});


app.get("/urls/:id", (request, response) => {
  const user_id = request.session.user_id;
  const shortURLKey = request.params.id;
  const longURL = urlDatabase[shortURLKey];
  const templateVars = { "shortURLKey": shortURLKey, "longURL": longURL, "PORT": PORT };

  if (users[user_id]) {
    response.render("urls_show", templateVars);
  } else {
    return response.status(401).send("You do not have permission to access this resource");
  };
});


app.get("/u/:shortURL", (request, response) => {
  let shortURLKey = request.params.shortURL;
  let matchedLongURL = urlDatabase[shortURLKey].longURL;
  response.redirect(matchedLongURL);
});


function hashPasswordMatch(userId, password) {
  if (bcrypt.compareSync(password, users[userId].hashedPassword)) { 
    return true;
  } else {    
    return false;
  }
};

app.post("/login", (request, response) => {
  const email = request.body.email.trim();
  const password = request.body.password;
  const userId = giveId(email);
  const verifyloginCredentials = hashPasswordMatch(userId, password);
  if (email === "" || password === "" ) {
    return response.status(400).send("Fields can't be blank."); 
  } else {
    if (userId && verifyloginCredentials) { 
      request.session.user_id = userId;
      return response.redirect("urls");
    } else {
      return response.status(403).send("Authentification error."); 
    }
  };
});

app.post("/register", (request, response) => {
  const email = request.body.email.trim();      
  const password = request.body.password.trim();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const randomId =  generateRandomNum();
  const user_id = request.session.user_id;
  
  registerRouteResponse(email, hashedPassword, randomId, response, request);
});


app.post("/urls", (request, response) => {
  const shortURL = generateRandomNum();  
  const longURL = request.body.longURL;
  const user_id = request.session.user_id;

  urlDatabase[shortURL] = { userId: user_id, longURL: longURL };
  response.redirect("urls/" + shortURL);
});


app.post("/urls/:id/update", (request, response) => {
  const user_id = request.session.user_id;
  const shortURLKey = request.params.id;
  const longURL = request.body.longURL;

  if (user_id === urlDatabase[shortURLKey].userId) {
    urlDatabase[shortURLKey] = { userId: user_id, longURL: longURL };  
    response.redirect("/urls/" + shortURLKey);
  } else {
    return response.status(401).send("You do not have permission to access this resource");     
  }
});


app.post("/urls/logout", (request, response) => {  
  request.session = null;
  response.redirect("/urls");
});


app.post("/urls/:id/delete", (request, response) => {
  const user_id = request.session.user_id;
  const shortURLKey = request.params.id;

  if (user_id === urlDatabase[shortURLKey].userId) {
    delete urlDatabase[shortURLKey];
    response.redirect("/urls");
  } else {
    return response.status(401).send("You do not have permission to access this resource");     
  }
});

    // server

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});