// Import express.js
const express = require("express");

// Create express app
var app = express();

const session = require('express-session');

// Support JSON and URL encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure sessions
app.use(session({
  secret: 'dracarys-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Set the view engine to pug
app.set('view engine', 'pug');
app.set('views', './app/views');

// Add static files location
app.use(express.static("static"));

// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const tutorRoutes = require('./routes/tutors');
const studentRoutes = require('./routes/students');
const subjectRoutes = require('./routes/subjects');

// Use the routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', tutorRoutes);
app.use('/', studentRoutes);
app.use('/', subjectRoutes);

// Error handling - 404
app.use(function (req, res, next) {
    res.status(404).render("404", { title: "404 - Not Found" });
});

// Error handling - General
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

// Start server on port 3000
app.listen(3000, function () {
    console.log(`Server running at http://127.0.0.1:3000/`);
});
