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

// Middleware to parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true }));

// Get the functions in the db.js file to use
const db = require('./services/db');
const authRoutes = require('./routes/auth');

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

// Mount the authentication form submission routes
app.use('/', authRoutes);

// Routes for login page

app.get("/login", function (req, res) {
    res.render("loginpage");
});

// Catch-all route for unhandled requests (404 Page Not Found)
app.use(function (req, res, next) {
    res.status(404).render('404');
});

// Start server on port 3000


app.listen(3000, function () {
    console.log(`Server running at http://127.0.0.1:3000/`);
});
