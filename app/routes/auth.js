const express = require('express');
const router = express.Router();
const { User } = require('../models/User');

router.get("/loginpage", function (req, res) {
    res.redirect("/login");
});

router.get("/login", function (req, res) {
    res.render("loginpage", { title: "Login - Dracarys", activePage: "login", error: req.query.error });
});

router.post("/login", async function (req, res) {
    const { email, password } = req.body;
    const user = await User.authenticate(email, password);
    if (user) {
        req.session.userId = user.user_id;
        req.session.role = user.role;
        req.session.loggedIn = true;
        res.redirect("/");
    } else {
        res.redirect("/login?error=Invalid email or password");
    }
});

router.get("/signup", function (req, res) {
    res.render("signup", { title: "Signup - Dracarys", activePage: "signup" });
});

router.post("/signup", async function (req, res) {
    const { fullName, email, password, role } = req.body;
    try {
        const userId = await User.register(fullName, email, password, role);
        req.session.userId = userId;
        req.session.role = role;
        req.session.loggedIn = true;
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
