// Import express.js
const express = require("express");

// Create express app
var app = express();

const session = require('express-session');
const path = require('path');

// Import models at top level
const { User } = require('./models/User');

// Support JSON and URL encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'dracarys-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
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
        const { User } = require('./models/User');
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
    } else {
        next();
    }
});

// Set the view engine to pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Add static files location
app.use(express.static(path.join(__dirname, '../static')));

// Import all controller modules using absolute paths to avoid any resolution issues
const indexRoutes = require(path.join(__dirname, 'controllers', 'index-controller'));
const authRoutes = require(path.join(__dirname, 'controllers', 'auth-controller'));
const studentRoutes = require(path.join(__dirname, 'controllers', 'student-controller'));
const subjectRoutes = require(path.join(__dirname, 'controllers', 'subject-controller'));
const tutorRoutes = require(path.join(__dirname, 'controllers', 'tutor-controller'));
const dashboardRoutes = require(path.join(__dirname, 'controllers', 'dashboard-controller'));
const adminRoutes = require(path.join(__dirname, 'controllers', 'admin-controller'));

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
    res.status(404).render("404", { title: "404 - Not Found", activePage: null });
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
