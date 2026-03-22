const express = require('express');
const router  = express.Router();
const { Tutor } = require('../models/Tutor');
const { Booking } = require('../models/Booking');
const db = require('../services/db');
const { requireLogin } = require('../middleware/auth');

// List all tutors (public)
router.get("/tutors", async function (req, res) {
    try {
        const results = await Tutor.getAll();
        res.render("search", { title: "Search Tutors", featuredTutors: results, activePage: "search" });
    } catch (err) {
        console.error("Failed to load tutors:", err);
        res.render("search", { title: "Search Tutors", featuredTutors: [], activePage: "search" });
    }
});

// Single tutor profile (public)
router.get("/tutor/:id", async function (req, res) {
    try {
        const tutor = new Tutor(req.params.id);
        await tutor.getTutorDetails();
        await tutor.getReviews();

        if (tutor.full_name) {
            let existingBooking = null;
            if (req.session.loggedIn && req.session.role === 'tutee') {
                existingBooking = await Booking.checkExisting(req.session.tuteeId, tutor.tutor_id);
            }

            res.render("profile", {
                title: tutor.full_name + " - Profile",
                tutor,
                existingBooking
            });
        } else {
            res.status(404).render("404", { title: "Tutor Not Found" });
        }
    } catch (err) {
        console.error('Tutor profile error:', err);
        res.status(500).render("404", { title: "Error loading tutor profile" });
    }
});

// Book lesson page — protected: must be logged in
router.get("/book_lesson/:id", requireLogin, async function (req, res) {
    try {
        if (req.session.role !== 'tutee') {
            return res.status(403).send("Only students can book lessons");
        }

        const tutor = new Tutor(req.params.id);
        await tutor.getTutorDetails();

        const subjects = await db.query('SELECT * FROM subjects');

        res.render("book_lesson", {
            title:    "Book a Lesson",
            tutor:    tutor.full_name ? tutor : { tutor_id: req.params.id, full_name: "Unknown Tutor" },
            subjects: subjects,
            activePage: "search"
        });
    } catch (err) {
        console.error("Book lesson page error:", err);
        res.status(500).render("404", { title: "Error loading booking page" });
    }
});

// Submit booking — protected: must be logged in as tutee
router.post("/book/:id", requireLogin, async function (req, res) {
    try {
        if (req.session.role !== 'tutee') {
            return res.status(403).send("Only students can book lessons");
        }

        const tutee_id = req.session.tuteeId;
        const tutor_id = req.params.id;

        // Check if already booked
        const existing = await Booking.checkExisting(tutee_id, tutor_id);
        if (existing) {
            return res.redirect(`/tutor/${tutor_id}?error=Already booked`);
        }

        await Booking.create(tutee_id, tutor_id);
        res.render("booking_success", { title: "Booking Successful", activePage: "search", tutorId: tutor_id });
    } catch (err) {
        console.error("Booking error:", err);
        res.status(500).send("Internal Server Error");
    }
});

// New Routes for Tutor to handle bookings
router.get("/tutor_dashboard", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutor') return res.redirect("/");
    try {
        const bookings = await Booking.getByTutor(req.session.tutorId);
        res.render("tutor_dashboard", { title: "Tutor Dashboard", bookings, activePage: "dashboard" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading dashboard");
    }
});

router.post("/booking/respond", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutor') return res.status(403).send("Unauthorized");
    const { booking_id, status } = req.body; // status: 'accepted' or 'declined'
    try {
        await Booking.updateStatus(booking_id, status);
        res.redirect("/tutor_dashboard");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating booking status");
    }
});

module.exports = router;
