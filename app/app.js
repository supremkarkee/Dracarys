// Import express.js
const express = require("express");
const path = require("path");


// Create express app
var app = express();

// Very important for pug template to work.
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// route for the root

app.get("/", function (req, res) {
    res.render("home");
});

// route for about page

app.get("/about", function (req, res) {
    res.render("about");
});

// Routes for home page

app.get("/home", function (req, res) {
    res.render("home");
});

// Routes for signup page

app.get("/signup", function (req, res) {
    res.render("signup");
});

// Routes for login page

app.get("/login", function (req, res) {
    res.render("loginpage");
});

// Start server on port 3000


app.listen(3000, function () {
    console.log(`Server running at http://127.0.0.1:3000/`);
});
