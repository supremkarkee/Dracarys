const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const db = require('../services/db');

router.get("/loginpage", function (req, res) {
    res.redirect("/login");
});

router.get("/login", function (req, res) {
    if (req.session.loggedIn) {
        return res.redirect("/");
    }
    res.render("loginpage", { title: "Login - Dracarys", activePage: "login", error: req.query.error });
});

router.post("/login", async function (req, res) {
    const { email, password } = req.body;
    const user = await User.authenticate(email, password);
    if (user) {
        req.session.userId = user.user_id;
        req.session.role = user.role;
        req.session.full_name = user.full_name;
        req.session.loggedIn = true;

        // Fetch role-specific ID
        if (user.role === 'tutor') {
            const tutorRows = await db.query('SELECT tutor_id FROM tutors WHERE user_id = ?', [user.user_id]);
            if (tutorRows.length > 0) req.session.tutorId = tutorRows[0].tutor_id;
        } else if (user.role === 'tutee') {
            const tuteeRows = await db.query('SELECT tutee_id FROM tutees WHERE user_id = ?', [user.user_id]);
            if (tuteeRows.length > 0) req.session.tuteeId = tuteeRows[0].tutee_id;
        }

        res.redirect("/");
    } else {
        res.redirect("/login?error=Invalid email or password");
    }
});

router.get("/signup", function (req, res) {
    if (req.session.loggedIn) {
        return res.redirect("/");
    }
    res.render("signup", { title: "Signup - Dracarys", activePage: "signup" });
});

router.post("/signup", async function (req, res) {
    const { firstName, lastName, email, password, role } = req.body;
    const fullName = `${firstName} ${lastName}`;
    const userRole = role === 'learner' ? 'tutee' : role; // Map learner to tutee
    try {
        const userId = await User.register(fullName, email, password, userRole);
        req.session.userId = userId;
        req.session.role = userRole;
        req.session.full_name = fullName;
        req.session.loggedIn = true;

        // Fetch role-specific ID
        if (userRole === 'tutor') {
            const tutorRows = await db.query('SELECT tutor_id FROM tutors WHERE user_id = ?', [userId]);
            if (tutorRows.length > 0) req.session.tutorId = tutorRows[0].tutor_id;
        } else if (userRole === 'tutee') {
            const tuteeRows = await db.query('SELECT tutee_id FROM tutees WHERE user_id = ?', [userId]);
            if (tuteeRows.length > 0) req.session.tuteeId = tuteeRows[0].tutee_id;
        }

        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.redirect("/signup?error=Email already registered");
    }
});

router.get("/logout", function (req, res) {
    req.session.destroy();
    res.redirect("/login");
});

module.exports = router;
