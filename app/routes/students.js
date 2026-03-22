const express = require('express');
const router = express.Router();
const { Student } = require('../models/Student');
const { requireLogin } = require('../middleware/auth');

// Redirect old route
router.get("/all-student", function (req, res) {
    res.redirect("/students");
});

// List all students — protected: must be logged in
router.get("/students", requireLogin, async function (req, res) {
    try {
        const results = await Student.getAll();
        res.render("all-student", { title: "Our Students", data: results });
    } catch (err) {
        console.error("Failed to load students:", err);
        res.status(500).render("404", { title: "Error loading students" });
    }
});

const { Student } = require('../models/Student');
const { Booking } = require('../models/Booking');
const { requireLogin } = require('../middleware/auth');

// My lessons — protected: must be logged in as tutee
router.get("/my_lessons", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutee') return res.redirect("/");
    try {
        const lessons = await Booking.getByTutee(req.session.tuteeId);
        res.render("my_lessons", { title: "My Lessons", lessons: lessons, activePage: "my_lessons" });
    } catch (err) {
        console.error("Failed to load lessons:", err);
        res.status(500).render("404", { title: "Error loading lessons" });
    }
});

module.exports = router;
