/**
 * Student Controller
 * 
 * This file handles everything related to students (tutees):
 * - A page showing all students on the platform
 * - A private "My Lessons" page where logged-in students can see their bookings
 */

const express = require('express');
const router = express.Router();

const { Tutee } = require('../models/Tutee');
const { Booking } = require('../models/Booking');
const { requireLogin } = require('../middleware/auth');

/**
 * GET /all-student
 * Old route that just redirects to the updated /students page.
 * (Kept for backward compatibility.)
 */
router.get("/all-student", function (req, res) {
    res.redirect("/students");
});

/**
 * GET /students
 * Shows a list of all students (tutees) on the platform.
 * Only logged-in users can access this page.
 */
router.get("/students", requireLogin, async function (req, res) {
    try {
        const students = await Tutee.getAll();

        res.render("AdminUsers", { 
            title: "Our Students", 
            users: students 
        });

    } catch (err) {
        console.error("Failed to load students:", err);
        res.status(500).render("Error404", { 
            title: "Error loading students" 
        });
    }
});

/**
 * GET /my_lessons
 * Shows the logged-in student's own lessons and bookings.
 * Only students (tutees) can access this page.
 */
router.get("/my_lessons", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutee') {
        return res.redirect("/");
    }

    try {
        const lessons = await Booking.getByTutee(req.session.tuteeId);

        res.render("MyLessons", { 
            title: "My Lessons", 
            lessons: lessons || [], 
            activePage: "my_lessons" 
        });

    } catch (err) {
        console.error("Failed to load lessons:", err);
        res.status(500).render("Error404", { 
            title: "Error loading lessons" 
        });
    }
});

module.exports = router;