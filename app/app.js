// Import express.js
// Imports express framework
const express = require("express");

// Create express app
var app = express();

const session = require('express-session');

// Internal framework tools
const path = require('path');

// Import models at top level
const { User } = require('./models/User');

// Support JSON and URL encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure sessions: This middleware sets up session management for the application
app.use(session({
    // secret: The key used to sign the session ID cookie. 
    // It uses an environment variable for security in production, 
    // or falls back to a random string for local development.
    secret: process.env.SESSION_SECRET || 'x9k2mP5vL8nQwRt3yH7bZc4jF1sV0aE6',

    // resave: Forces the session to be saved back to the session store, 
    // even if the session was never modified during the request. 
    // Setting to false optimizes performance and avoids race conditions.
    resave: false,

    // saveUninitialized: Forces a session that is "uninitialized" to be saved to the store.
    // Setting to false helps implement login sessions and complies with laws that require permission before setting a cookie.
    saveUninitialized: false,

    // cookie: Settings object for the session ID cookie.
    // secure: false means the cookie will be sent over HTTP (not requiring HTTPS). 
    // This is necessary for local development without SSL.
    cookie: { secure: false }
}));

// Simple middleware to attach user session data to res.locals
app.use(function (req, res, next) {
    res.locals.loggedIn = req.session.loggedIn || false;
    res.locals.userId = req.session.userId || null;
    res.locals.role = req.session.role || null;
    res.locals.tutorId = req.session.tutorId || null;
    res.locals.tuteeId = req.session.tuteeId || null;
    res.locals.user = null;

    // Only attempt to hydrate user object if logged in
    if (req.session.loggedIn && req.session.userId) {
        // Fix Bug 8: User is already imported at the top of the file, no need to require again
        const user = new User(req.session.userId);
        user.getUserDetails()
            .then(() => {
                res.locals.user = user;
                next();
            })
            .catch(err => {
                console.error("Session User Hydration Error:", err);
                next();
            });
    }
    else {
        next();
    }
});

// Set the view engine to pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Add static files location
app.use(express.static(path.join(__dirname, '../static')));

// Import all controller modules using absolute paths to avoid any resolution issues
const indexRoutes = require(path.join(__dirname, 'controllers', 'IndexController'));
const authRoutes = require(path.join(__dirname, 'controllers', 'AuthController'));
const studentRoutes = require(path.join(__dirname, 'controllers', 'StudentController'));
const subjectRoutes = require(path.join(__dirname, 'controllers', 'SubjectController'));
const tutorRoutes = require(path.join(__dirname, 'controllers', 'TutorController'));
const dashboardRoutes = require(path.join(__dirname, 'controllers', 'DashboardController'));
const adminRoutes = require(path.join(__dirname, 'controllers', 'AdminController'));

// Mount the routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', studentRoutes);
app.use('/', subjectRoutes);
app.use('/', tutorRoutes);
app.use('/', dashboardRoutes);
app.use('/', adminRoutes);

// Error handling - 404
app.use(function (req, res, next) {
    res.status(404).render("Error404", { title: "404 - Not Found", activePage: null });
});

// Error handling - General (Enhanced for diagnostics)
app.use(function (err, req, res, next) {
    console.error("Express Error Handler:", err && (err.stack || err));
    res.status(500).send(`
        <h1>500 Internal Server Error</h1>
        <pre>${err ? (err.stack || err) : 'Unknown Error'}</pre>
    `);
});

// Export the app for use in index.js
module.exports = app;
