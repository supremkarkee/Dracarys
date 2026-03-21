const express = require('express');
const router = express.Router();
const { Tutor } = require('../models/Tutor');

// Create a route for root - /
router.get("/", async function (req, res) {
    try {
        const sql = 'SELECT * FROM tutors JOIN users ON tutors.user_id = users.user_id ORDER BY rating DESC LIMIT 3';
        const featuredTutors = await Tutor.getAll(); // Actually, I should use a custom query for 3 tutors
        // Using wait, Tutor.getAll returns all. I'll use a direct query for now or add a static method.
        const db = require('../services/db');
        const featured = await db.query('SELECT * FROM tutors JOIN users ON tutors.user_id = users.user_id ORDER BY rating DESC LIMIT 3');
        
        res.render("home", {
            title: "Dracarys Home",
            heading: "Find Your Perfect Tutor Today",
            activePage: "home",
            featuredTutors: featured
        });
    } catch (err) {
        console.error(err);
        res.render("home", { title: "Dracarys Home", activePage: "home", featuredTutors: [] });
    }
});

router.get("/home", function (req, res) {
    res.redirect("/");
});

// Create a route for /about
router.get("/about", function (req, res) {
    res.render("about", { title: "About Dracarys", activePage: "about" });
});

router.get("/news", function (req, res) {
    res.render("news", { title: "News & Feeds - Dracarys", activePage: "news" });
});

module.exports = router;
