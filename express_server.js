const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

  // settings

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));  // allows us to access POST request parameters
app.use(cookieParser());

  // database

const users = { 
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

  const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.ca",
  "77h3fP": "http://www.gupmusic.com"
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
      return response.redirect("/");
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
    response.redirect("urls/");
  };
};

  //middleware, runs between the route

app.use((request, response, next) => {                        
  var user = users[request.cookies.user_id];
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


     // SHORT URL REQUESTS TO ORIGINAL LONG URL ************************

app.get("/u/:shortURL", (request, response) => {
  let shortURLKey = request.params.shortURL;    // Grab the params from URL path and give it it's own variable.
  let longURL = urlDatabase[shortURLKey];       // redirect to original URL
  response.redirect(longURL);
});


    // JSON ************************

app.get("/urls.json", (request, response) => {  // 
  response.json(urlDatabase);
});

  // URLS FORM PAGE FROM urls_index EJS ************************

app.get("/urls", (request, response) => {
  const templateVars = { "urls": urlDatabase };
  const user_id = request.cookies.user_id;

  if (users[user_id]) {
    response.render("urls_index", templateVars);
  } else { 
    response.redirect("/login");
  };
});
  


    // NEW POST PAGE renders from urls_new EJS ************************

app.get("/urls/new", (request, response) => {
  const templateVars = { "urls": urlDatabase};
  const user_id = request.cookies.user_id;

  if (users[user_id]) {
    response.render("urls_new", templateVars);
  } else { 
    response.redirect("/login");
  };
});

    // Register Page ************************

app.get("/register", (request, response) => {
  response.render("urls_register");
});


    // Login Page ************************

app.get("/login", (request, response) => {
  response.render("urls_login");
});


    // GRAB VALUE FROM NEW SHORT URL PAGE AND USE IN urls_show EJS FILE ************************

app.get("/urls/:id", (request, response) => {
  const shortURLKey = request.params.id;
  const longURL = urlDatabase[shortURLKey];
  const templateVars = { "shortURLKey": shortURLKey, "longURL": longURL };

  response.render("urls_show", templateVars);
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

  registerRouteResponse(email, password, randomId, response);
});


// LOGOUT/ CLEAR COOKIE and REDIRECT TO /URLS  ************************

app.post("/urls/logout", (request, response) => {  
    response.clearCookie("user_id");
    response.redirect("login/");
  });


// GENERATE SHORT URL AND SEND TO DATABASE THEN REDIRECT TO URLS/NEW SHORT URL ************************


app.post("/urls", (request, response) => {
  const generateShortURL = generateRandomNum();  //Give me a random string
  urlDatabase[generateShortURL] = request.body.longURL;   //longURL is ID in urls_new.ejs Form. Random String is Key, longURL is value.

  response.redirect("urls/" + generateShortURL);
});




  // UPDATE ENTRIES RESOURCE on Update Button in urls_show ************************

app.post("/urls/:id/update", (request, response) => {
  const shortURLKey = request.params.id;
  const newLongURL = request.body.longURL;

  urlDatabase[shortURLKey] = newLongURL;
  response.redirect("/urls/" + shortURLKey);
});


  // DELETE ENTRIES RESOURCE on Delete Button ************************

app.post("/urls/:id/delete", (request, response) => {
  const shortURLKey = request.params.id;
  delete urlDatabase[shortURLKey];
  response.redirect("/urls");
});


    // SERVER ************************

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
