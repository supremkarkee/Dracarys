// Import express.js
const express = require("express");

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function (req, res) {
    res.render("home", { 'title': 'Dracarys | Ignite Your Potential' });
});

// Create a route for /about (simple team page)
app.get("/about", function (req, res) {
    res.render("about", { 'title': 'About Us | Dracarys' });
});

// Detailed about page (community tuition marketplace)
app.get("/about-detailed", function (req, res) {
    res.render("about-detailed");
});

// Login page
app.get("/login", function (req, res) {
    res.render("loginpage");
});

// Signup page
app.get("/signup", function (req, res) {
    res.render("signup");
});

// Main landing page
app.get("/main", function (req, res) {
    res.render("main");
});

// Start server on port 3000


app.listen(3000, function () {
    console.log(`Server running at http://127.0.0.1:3000/`);
});
