const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
// var cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');

// var cookieSession = require('cookie-session');
// app.use(cookieSession({
//     name: 'session',
//     keys: ['freebird']
// }));

  // settings

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));  // allows us to access POST request parameters
// app.use(cookieParser());

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

  // helpers

function generateRandomNum() {
  let shortURL = "";
  const allowedChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 7; i++) {
    shortURL += allowedChar.charAt(Math.floor(Math.random() * allowedChar.length));
  };
  return shortURL;    // add this later: if this short key is already in the database, run again.  
};

function getURLsForUser(user_id) {
  const singleURLObj = {}
  for(let uniqueShortURL in urlDatabase) {
    const currentURL = urlDatabase[uniqueShortURL];
    if(currentURL.userId === user_id) {
      singleURLObj[uniqueShortURL] = currentURL;
    }
  }
  return singleURLObj;
};


function giveEmail(email) {
  for(let user in users) {
    let currentUser = users[user];
    if (currentUser.email === email) {
      return currentUser.email;
    }; 
  };
};

function giveId(email, password) {
  for(let user in users) {
    let currentUser = users[user];
    if (currentUser.email === email) {
      if (currentUser.password === password);
      return currentUser.id;
    }; 
  };
};

function authenticateUserPassword(email, password) {
  for(let user in users) {
    let currentUser = users[user];
    if (currentUser.email === email) {
      if (currentUser.password === password);
      return currentUser.password;
    }; 
  };
};

function loginRouteResponse(email, password, response) {
  if (email === "" || password === "" ) {
    return response.status(400).send("Fields can't be blank."); 
  } else {
    if (authenticateUserPassword(email, password) === password) { 
      response.cookie("user_id", giveId(email, password));
      return response.redirect("urls"); //CHANGE
    } else {
      return response.status(403).send("Authentification error."); 
    };
  };
};

function registerRouteResponse(email, password, randomId, response) {
  if (email === "" || password === "" ) {
    response.status(400).send("Fields can't be blank."); 
  } else if (giveEmail(email)) {
    response.status(400).send("Email must be unique.");   
  } else {
    let newUser = {
      id: randomId,
      email: email,
      password: password
    };
    
    users[randomId] = newUser;
    response.cookie("user_id", randomId);
    response.redirect("urls");
  };
};

  //middleware, runs between the route

app.use((request, response, next) => {                        
  const user = users[request.cookies.user_id];
  response.locals.user = user;
  return next();
}); 


  // routes


    // HOME PAGE ************************

app.get("/", (request, response) => {
  const templateVars = { "urls": urlDatabase };
  const user_id = request.cookies.user_id;

  if (users[user_id]) {
    response.render("urls_index", templateVars);
  } else { 
    response.redirect("/login");
  };
});

    // JSON *

app.get("/urls.json", (request, response) => {  // 
  response.json(urlDatabase);
});

    // Register Page ************************

app.get("/register", (request, response) => {
  const user_id = request.cookies.user_id;

  if (user_id) { 
    response.redirect("urls"); 
  } else { 
    response.render("urls_register");
  }
});


    // Login Page ************************

app.get("/login", (request, response) => {
  const user_id = request.cookies.user_id;

  if (users[user_id]) { 
    response.redirect("urls"); 
  } else { 
    response.render("urls_login");
  }
});


// URLS FORM PAGE FROM urls_index EJS ************************

app.get("/urls", (request, response) => {
  const user_id = request.cookies.user_id;
  const templateVars = { "urls": getURLsForUser(user_id) };

  if (users[user_id]) {
    response.render("urls_index", templateVars);
  } else { 
    response.redirect("/login");
  };
});

    // NEW POST PAGE renders from urls_new EJS ************************

app.get("/urls/new", (request, response) => {
  const user_id = request.cookies.user_id;

  if (users[user_id]) {
    response.render("urls_new");
  } else { 
    response.redirect("/login");
  };
});


    // GRAB VALUE FROM NEW SHORT URL PAGE AND USE IN urls_show EJS FILE ************************

app.get("/urls/:id", (request, response) => {
  const user_id = request.cookies.user_id;
  const shortURLKey = request.params.id;
  const longURL = urlDatabase[shortURLKey];
  const templateVars = { "shortURLKey": shortURLKey, "longURL": longURL };

  if (users[user_id]) {
    response.render("urls_show", templateVars);
  } else { 
    return response.status(401).send("You do not have permission to access this resource");   
  };
});

  // SHORT URL REQUESTS TO ORIGINAL LONG URL ************************

app.get("/u/:shortURL", (request, response) => {
  let shortURLKey = request.params.shortURL;    // Grab the params from URL path and give it it's own variable.
  let longURL = urlDatabase[shortURLKey].longURL;       // redirect to original URL
  response.redirect(longURL);
});


// Login A User ************************

app.post("/login", (request, response) => {
  const email = request.body.email.trim();          // grab email from form name.
  const password = request.body.password;          // grab password from form name.

  loginRouteResponse(email, password, response); 
});


// Register A User ************************

app.post("/register", (request, response) => {
  const email = request.body.email.trim();          // grab email from form name.
  const password = request.body.password.trim();   // grab password from form name.
  const randomId =  generateRandomNum();                 // this will be USER ID
  const user_id = request.cookies.user_id;  // cookie
  
  registerRouteResponse(email, password, randomId, response);
});


// GENERATE SHORT URL AND SEND TO DATABASE THEN REDIRECT TO URLS/NEW SHORT URL ************************

app.post("/urls", (request, response) => {
  const shortURL = generateRandomNum();  //Give me a random string
  const longURL = request.body.longURL;
  const user_id = request.cookies.user_id;

  urlDatabase[shortURL] = { userId: user_id, longURL: longURL };
  response.redirect("urls/" + shortURL);
});


  // UPDATE ENTRIES RESOURCE on Update Button in urls_show ************************

app.post("/urls/:id/update", (request, response) => {
  const user_id = request.cookies.user_id;
  const shortURLKey = request.params.id;
  const longURL = request.body.longURL;

  if (user_id === urlDatabase[shortURLKey].userId) {
    urlDatabase[shortURLKey] = { userId: user_id, longURL: longURL }; // oiginal: newLongURL;  
    response.redirect("/urls/" + shortURLKey);
  } else {
    return response.status(401).send("You do not have permission to access this resource");     
  }
});



// LOGOUT/ CLEAR COOKIE and REDIRECT TO /URLS  ************************

app.post("/urls/logout", (request, response) => {  
  response.clearCookie("user_id");
  response.redirect("/urls");
});


  // DELETE ENTRIES RESOURCE on Delete Button ************************

app.post("/urls/:id/delete", (request, response) => {
  const user_id = request.cookies.user_id;
  const shortURLKey = request.params.id;

  if (user_id === urlDatabase[shortURLKey].userId) {
    delete urlDatabase[shortURLKey];
    response.redirect("/urls");
  } else {
    return response.status(401).send("You do not have permission to access this resource");     
  }
});


    // SERVER ************************

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
