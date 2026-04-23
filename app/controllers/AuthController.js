/**
 * Auth Controller
 * 
 * This file handles all authentication for the platform:
 * login, signup, logout, and session management.
 * It creates and destroys user sessions so people can access
 * protected parts of the site.
 */

const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const db = require('../services/db');

/**
 * GET /loginpage
 * Old route that just redirects to the real login page.
 * (Kept for backward compatibility.)
 */
router.get("/loginpage", function (req, res) {
    res.redirect("/login");
});

/**
 * GET /login
 * Shows the login page to users who aren't already logged in.
 * If they are logged in, it sends them straight to the homepage.
 */
router.get("/login", function (req, res) {
    if (req.session.loggedIn) {
        return res.redirect("/");
    }

    res.render("LoginPage", {
        title: "Login - Dracarys",
        activePage: "login",
        error: req.query.error
    });
});

/**
 * POST /login
 * Checks the user's email and password.
 * If correct, it creates a session and logs them in.
 * If wrong, it sends them back to login with an error message.
 */
router.post("/login", async function (req, res) {
    const { email, password } = req.body;

    const user = await User.authenticate(email, password);

    if (user) {
        // Save basic user info into the session
        req.session.userId = user.user_id;
        req.session.role = user.role;
        req.session.full_name = user.full_name;
        req.session.loggedIn = true;

        // Add the role-specific ID (tutor_id or tutee_id) to the session
        if (user.role === 'tutor') {
            const tutorRows = await db.query(
                'SELECT tutor_id FROM tutors WHERE user_id = ?',
                [user.user_id]
            );
            if (tutorRows.length > 0) {
                req.session.tutorId = tutorRows[0].tutor_id;
            }
        } else if (user.role === 'tutee') {
            const tuteeRows = await db.query(
                'SELECT tutee_id FROM tutees WHERE user_id = ?',
                [user.user_id]
            );
            if (tuteeRows.length > 0) {
                req.session.tuteeId = tuteeRows[0].tutee_id;
            }
        }

        res.redirect("/");
    } else {
        res.redirect("/login?error=Invalid email or password");
    }
});

/**
 * GET /signup
 * Shows the signup page to users who aren't already logged in.
 * If they are logged in, it sends them to the homepage.
 * Also passes any error message from the query string so the page can show it.
 */
router.get("/signup", function (req, res) {
    if (req.session.loggedIn) {
        return res.redirect("/");
    }

    res.render("Signup", {
        title: "Signup - Dracarys",
        activePage: "signup",
        error: req.query.error
    });
});

/**
 * POST /signup
 * Creates a new user account after running several validations:
 * - Passwords must match
 * - Names cannot contain numbers
 * - Password must be strong (8+ chars with upper, lower, number, special)
 * Then logs the user in automatically.
 */
router.post("/signup", async function (req, res) {
    const { firstName, lastName, email, password, confirmPassword, role } = req.body;

    // Basic validation checks before trying to create the account
    if (password !== confirmPassword) {
        return res.redirect("/signup?error=Passwords do not match.");
    }

    if (/\d/.test(firstName) || /\d/.test(lastName)) {
        return res.redirect("/signup?error=Names cannot contain numbers.");
    }

    const strongPasswordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}/;
    if (!strongPasswordRegex.test(password)) {
        return res.redirect("/signup?error=Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.");
    }

    const fullName = `${firstName} ${lastName}`;
    const userRole = role === 'learner' ? 'tutee' : role; // Map learner to tutee

    try {
        const userId = await User.register(fullName, email, password, userRole);

        // Save the new user into the session (they're now logged in)
        req.session.userId = userId;
        req.session.role = userRole;
        req.session.full_name = fullName;
        req.session.loggedIn = true;

        // Add the role-specific ID (tutor_id or tutee_id) to the session
        if (userRole === 'tutor') {
            const tutorRows = await db.query(
                'SELECT tutor_id FROM tutors WHERE user_id = ?',
                [userId]
            );
            if (tutorRows.length > 0) {
                req.session.tutorId = tutorRows[0].tutor_id;
            }
        } else if (userRole === 'tutee') {
            const tuteeRows = await db.query(
                'SELECT tutee_id FROM tutees WHERE user_id = ?',
                [userId]
            );
            if (tuteeRows.length > 0) {
                req.session.tuteeId = tuteeRows[0].tutee_id;
            }
        }

        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.redirect("/signup?error=Email already registered");
    }
});

/**
 * GET /logout
 * Destroys the current session and sends the user back to the login page.
 */
router.get("/logout", function (req, res) {
    req.session.destroy();
    res.redirect("/login");
});

module.exports = router;