// Import express.js
const express = require("express");

// Create express app
var app = express();

const session = require('express-session');

// Support JSON and URL encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure sessions
// SESSION_SECRET must be set in .env — never hardcode this in production
app.use(session({
    secret: process.env.SESSION_SECRET || 'dracarys-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false, // fixed: was 'true' which created sessions for every anonymous visitor
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Make only safe, necessary session fields available to all templates.
// Do NOT expose the entire req.session object — it leaks internal metadata.
app.use((req, res, next) => {
    res.locals.user = {
        loggedIn:  req.session.loggedIn  || false,
        role:      req.session.role      || null,
        userId:    req.session.userId    || null,
    };
    next();
});

// Set the view engine to pug
app.set('view engine', 'pug');
app.set('views', './app/views');

// Add static files location
app.use(express.static("static"));

// Import routes
const indexRoutes   = require('./routes/index');
const authRoutes    = require('./routes/auth');
const tutorRoutes   = require('./routes/tutors');
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

// Export the app — the server is started in index.js, NOT here.
// This makes the app importable for testing without starting a live server.
module.exports = app;
