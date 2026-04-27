/**
 * Main App Setup
 * 
 * This is the central file that brings the entire Dracarys platform together.
 * It creates the Express server, sets up sessions, loads all controllers,
 * configures the view engine (Pug), and handles errors.
 */

const express = require("express");
const session = require('express-session');
const path = require('path');

// Import our User model (used in the session middleware below)
const { User } = require('./models/User');

// Create the Express application
const app = express();

// Support JSON and form data in requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Session Configuration
 * 
 * This middleware handles user login sessions across the whole website.
 * It remembers who is logged in between page visits.
 */
app.use(session({
    // Secret key used to sign the session cookie (keeps it secure)
    secret: process.env.SESSION_SECRET || 'x9k2mP5vL8nQwRt3yH7bZc4jF1sV0aE6',
    
    // Don't save the session if nothing changed (better performance)
    resave: false,
    
    // Don't create a session until the user actually logs in
    saveUninitialized: false,
    
    // Cookie settings (secure: false = works on localhost without HTTPS)
    cookie: { secure: false }
}));

/**
 * Custom Middleware: Attach User Info to Every View
 * 
 * This runs on every request and makes the logged-in user's data
 * available to all Pug templates (so we can show "Welcome, Alex" etc.).
 */
app.use(function (req, res, next) {
    res.locals.loggedIn = req.session.loggedIn || false;
    res.locals.userId   = req.session.userId || null;
    res.locals.role     = req.session.role || null;
    res.locals.tutorId  = req.session.tutorId || null;
    res.locals.tuteeId  = req.session.tuteeId || null;
    res.locals.user     = null;

    // If the user is logged in, load their full details once
    if (req.session.loggedIn && req.session.userId) {
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

// Set Pug as our template engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, images, JavaScript) from the static folder
app.use(express.static(path.join(__dirname, '../static')));

// Import all our cleaned controllers
const indexRoutes     = require(path.join(__dirname, 'controllers', 'IndexController'));
const authRoutes      = require(path.join(__dirname, 'controllers', 'AuthController'));
const studentRoutes   = require(path.join(__dirname, 'controllers', 'StudentController'));
const subjectRoutes   = require(path.join(__dirname, 'controllers', 'SubjectController'));
const tutorRoutes     = require(path.join(__dirname, 'controllers', 'TutorController'));
const dashboardRoutes = require(path.join(__dirname, 'controllers', 'DashboardController'));
const adminRoutes     = require(path.join(__dirname, 'controllers', 'AdminController'));

// Mount all routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', studentRoutes);
app.use('/', subjectRoutes);
app.use('/', tutorRoutes);
app.use('/', dashboardRoutes);
app.use('/', adminRoutes);

// 404 Error Page
app.use(function (req, res) {
    res.status(404).render("Error404", { 
        title: "Page Not Found", 
        errorCode: "404",
        activePage: null 
    });
});

// General Error Handler (for unexpected crashes)
app.use(function (err, req, res, next) {
    console.error("Express Error Handler:", err && (err.stack || err));
    res.status(500).render("Error404", { 
        title: "Internal Server Error",
        errorCode: "500",
        message: "Something went wrong on our end. Our dragons are working on it!",
        activePage: null
    });
});

// Export the app so index.js can start the server
module.exports = app;