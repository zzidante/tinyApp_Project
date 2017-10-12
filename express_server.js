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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.ca",
  "77h3fP": "http://www.gupmusic.com"
};

  // helpers

function generateURL() {
  let shortURL = "";
  const allowedChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 7; i++) {
    shortURL += allowedChar.charAt(Math.floor(Math.random() * allowedChar.length));
  };
  return shortURL;    // add this later: if this short key is already in the database, run again.  
};



app.use((request, response, next) => {   // runs between every route REQ/RES
  response.locals.username = request.cookies["username"];
  return next();
}); 


  // routes


    // HOME PAGE ************************

app.get("/", (request, response) => {           // We render "Hello!" when root port requested.
  response.end("Hello!");
});


// // SHORT URL REQUESTS TO ORIGINAL LONG URL ************************

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
  let templateVars = { "urls": urlDatabase } ;
  response.render("urls_index", templateVars);
});
  

    // NEW POST PAGE renders from urls_new EJS ************************

app.get("/urls/new", (request, response) => {
  response.render("urls_new");
});


    // GRAB VALUE FROM NEW SHORT URL PAGE AND USE IN urls_show EJS FILE ************************

app.get("/urls/:id", (request, response) => {
  const shortURLKey = request.params.id;
  const longURL = urlDatabase[shortURLKey];
  // const username = request.cookie["username"];
  
  let templateVars = { "shortURLKey": shortURLKey, "longURL": longURL };
  response.render("urls_show", templateVars);
});


// LOGOUT/ CLEAR COOKIE and REDIRECT TO /URLS  ************************

app.post("/logout", (request, response) => {
  
    response.clearCookie(request.body.username);
    response.redirect("urls/");
  })


// GENERATE SHORT URL AND SEND TO DATABASE THEN REDIRECT TO URLS/NEW SHORT URL ************************


app.post("/urls", (request, response) => {
  let generateShortURL = generateURL();  //Give me a random string
  urlDatabase[generateShortURL] = request.body.longURL;   //longURL is ID in urls_new.ejs Form. Random String is Key, longURL is value.

  response.redirect("urls/" + generateShortURL);
});

// TAKE USERNAME FROM FORM SUBMISSION + SET COOKIE ************************


app.post("/login", (request, response) => {
  let currentUser = request.body.username;   // grab username from form name.
  response.cookie('username', currentUser);        // set cookie to username
  response.redirect("urls/");                 // redirect to urls

// use endpoint to set cookie parameter called cookie to val of username in form (req.body)
// after set cookie, redirect to /urls page.

});


  // UPDATE ENTRIES RESOURCE on Update Button in urls_show ************************

app.post("/urls/:id/update", (request, response) => {
  let shortURLKey = request.params.id;
  let newLongURL = request.body.longURL;

  urlDatabase[shortURLKey] = newLongURL;
  response.redirect("/urls/" + shortURLKey);
});


  // DELETE ENTRIES RESOURCE on Delete Button ************************

app.post("/urls/:id/delete", (request, response) => {
  let shortURLKey = request.params.id;
  delete urlDatabase[shortURLKey];
  response.redirect("/urls");
});


    // CONNECTION TEXT ************************

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

