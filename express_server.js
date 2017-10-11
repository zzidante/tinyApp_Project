var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

generateRandomString() => {
  const allowedCharacters = "^[a-zA-Z0-9]*$";
  const numberOfDigits = 6;  
  const randomString = "";
  allowedCharacters.forEach(function (character) {
    randomString += allowedCharacters.charAt(Math.floor(Math.random() * numberOfDigits));
  });
  console.log(randomString);
}

var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.ca"
};

app.get("/", (request, response) => {
  response.end("Hello!");
});

app.get("/urls.json", (request, response) => {
  response.json(urlDatabase);
});

app.get("/urls", (request, response) => {
  let templateVars = { urls: urlDatabase };
  response.render("urls_index", templateVars);
});

app.get("/urls/:id", (request, response) => {
  let templateVars = { shortURL: req.params.id };
  response.render("urls_show", templateVars);
});

app.get("/hello", (request, response) => {
  response.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});