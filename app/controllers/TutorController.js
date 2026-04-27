/**
 * Tutor Controller
 * 
 * This file handles everything students (tutees) do with tutors:
 * - Browsing and searching for tutors
 * - Viewing individual tutor profiles
 * - Booking lessons
 * - Leaving reviews, flagging, favoriting, and canceling bookings
 * 
 * Tutors also use part of this for responding to booking requests.
 */

const express = require('express');
const router = express.Router();

const { Tutor } = require('../models/Tutor');
const { Booking } = require('../models/Booking');
const { Subject } = require('../models/Subject');
const db = require('../services/db');
const { requireLogin } = require('../middleware/auth');

/**
 * GET /browse/tutors
 * Main page where students can search and filter tutors.
 * Supports search by name, subject, language, flagged, or favorites.
 */
router.get("/browse/tutors", async function (req, res) {
    try {
        const query = req.query.q || '';
        const subjectFilter = req.query.subject || 'all';
        const languageFilter = req.query.lang || 'all';
        const flaggedOnly = req.query.flagged === 'true';
        const favoritesOnly = req.query.favorites === 'true';

        // Get subjects for the filter dropdown
        const subjects = await Subject.getAll();

        // Get unique languages from all tutors for the filter
        const langResult = await db.query("SELECT DISTINCT languages FROM tutors WHERE languages IS NOT NULL AND languages != ''");
        const allLangsSet = new Set();
        langResult.forEach(row => {
            row.languages.split(',').forEach(l => {
                if (l.trim()) allLangsSet.add(l.trim());
            });
        });
        const languages = Array.from(allLangsSet).sort();

        // Search is handled inside the Tutor model
        const tutors = await Tutor.search(
            query,
            subjectFilter,
            flaggedOnly,
            req.session.tuteeId,
            languageFilter,
            favoritesOnly
        );

        res.render("Search", {
            title: "Browse Tutors",
            data: tutors || [],
            activePage: "search",
            query: query,
            subjects: subjects || [],
            languages: languages || [],
            selectedSubject: subjectFilter,
            selectedLanguage: languageFilter,
            flaggedOnly: flaggedOnly,
            favoritesOnly: favoritesOnly,
            role: req.session.role
        });

    } catch (err) {
        console.error("Failed to load tutors:", err);

        // Fallback page so the user doesn't see a broken screen
        res.render("Search", {
            title: "Browse Tutors",
            data: [],
            subjects: [],
            selectedSubject: 'all',
            activePage: "search"
        });
    }
});

/**
 * GET /tutors
 * Old route that redirects to the new browse page.
 */
router.get("/tutors", (req, res) => res.redirect("/browse/tutors"));

/**
 * GET /tutor/:id
 * Shows a single tutor's full profile, reviews, and allows actions
 * like booking, reviewing, flagging, or favoriting (if logged in as student).
 */
router.get("/tutor/:id", async function (req, res) {
    try {
        const tutor = new Tutor(req.params.id);
        await tutor.getTutorDetails();
        await tutor.getReviews();

        if (!tutor.full_name) {
            return res.status(404).render("Error404", { title: "Tutor Not Found" });
        }

        let existingBooking = null;
        let isFlagged = false;
        let isFavorite = false;

        // Only check extra info if the user is a logged-in student
        if (req.session.loggedIn && req.session.role === 'tutee') {
            existingBooking = await Booking.checkExisting(req.session.tuteeId, tutor.tutor_id);

            // Check if this tutor is in the student's favorites
            const favCheck = await db.query(
                'SELECT * FROM favourites_tutors WHERE tutor_id = ? AND tutee_id = ?',
                [tutor.tutor_id, req.session.tuteeId]
            );
            isFavorite = favCheck.length > 0;
        }

        res.render("Profile", {
            title: tutor.full_name + " - Profile",
            tutor,
            existingBooking,
            isFlagged,
            isFavorite,
            role: req.session.role,
            loggedIn: req.session.loggedIn
        });

    } catch (err) {
        console.error('Tutor profile error:', err);
        res.status(500).render("Error404", { title: "Error loading tutor profile" });
    }
});

/**
 * GET /book_lesson/:id
 * Shows the booking form for a specific tutor (only for logged-in students).
 */
router.get("/book_lesson/:id", requireLogin, async function (req, res) {
    try {
        if (req.session.role !== 'tutee') {
            return res.status(403).send("Only students can book lessons");
        }

        const tutor = new Tutor(req.params.id);
        await tutor.getTutorDetails();

        // Use the tutor's own subjects if available, otherwise show all
        let subjects = [];
        if (tutor.subjects && tutor.subjects.length > 0) {
            subjects = tutor.subjects.map(s => ({ subject_name: s }));
        } else {
            subjects = await db.query('SELECT * FROM subjects');
        }

        res.render("BookLesson", {
            title: "Book a Lesson",
            tutor: tutor.full_name ? tutor : { tutor_id: req.params.id, full_name: "Unknown Tutor" },
            subjects: subjects,
            activePage: "search"
        });

    } catch (err) {
        console.error("Book lesson page error:", err);
        res.status(500).render("Error404", { title: "Error loading booking page" });
    }
});

/**
 * POST /book/:id
 * Creates a new lesson booking (only for logged-in students).
 */
router.post("/book/:id", requireLogin, async function (req, res) {
    try {
        if (req.session.role !== 'tutee') {
            return res.status(403).send("Only students can book lessons");
        }

        const tutee_id = req.session.tuteeId;
        const tutor_id = req.params.id;

        // Prevent double-booking the same tutor
        const existing = await Booking.checkExisting(tutee_id, tutor_id);
        if (existing) {
            return res.redirect(`/tutor/${tutor_id}?error=Already booked`);
        }

        const { date, time, end_time, subject_name } = req.body;

        const start = new Date(`1970-01-01T${time}`);
        const end = new Date(`1970-01-01T${end_time}`);

        // Guard against invalid time formats
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).send("Invalid time format provided.");
        }

        const durationHours = (end - start) / (1000 * 60 * 60);

        if (durationHours < 1 || durationHours > 3) {
            return res.status(400).send("Lesson must be between 1 and 3 hours.");
        }

        await Booking.create(tutee_id, tutor_id, date, time, end_time, subject_name);

        const tutor = new Tutor(tutor_id);
        await tutor.getTutorDetails();

        res.render("BookingSuccess", {
            title: "Booking Successful",
            activePage: "browse-tutors",
            tutorId: tutor_id,
            message: `Your lesson request for ${subject_name} with ${tutor.full_name} has been sent!`
        });

    } catch (err) {
        console.error("Booking error:", err);
        res.status(500).send("Internal Server Error");
    }
});

/**
 * POST /booking/respond
 * Tutor accepts or declines a booking request from the dashboard.
 */
router.post("/booking/respond", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutor') {
        return res.status(403).send("Unauthorized");
    }

    const { booking_id, status, message } = req.body;

    try {
        await Booking.updateStatus(booking_id, status, message);

        // Recalculate points for the tutor
        const bookingSql = 'SELECT tutor_id FROM bookings WHERE booking_id = ?';
        const bookingResult = await db.query(bookingSql, [booking_id]);
        if (bookingResult.length > 0) {
            const tutor = new Tutor(bookingResult[0].tutor_id);
            await tutor.calculatePoints();
        }

        res.redirect("/dashboard/tutor");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating booking status");
    }
});

/**
 * POST /tutor/:id/review
 * Student leaves or updates a review for a tutor.
 */
router.post("/tutor/:id/review", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutee') {
        return res.status(403).send("Only students can leave reviews");
    }

    const tutor_id = req.params.id;
    const tutee_id = req.session.tuteeId;
    const { rating, feedback } = req.body;

    try {
        // Keep feedback under 200 words
        const limitedFeedback = feedback.split(' ').slice(0, 200).join(' ');

        const existing = await db.query(
            'SELECT * FROM reviews WHERE tutor_id = ? AND tutee_id = ?',
            [tutor_id, tutee_id]
        );

        if (existing.length > 0) {
            await db.query(
                'UPDATE reviews SET rating = ?, feedback = ?, review_date = NOW() WHERE tutor_id = ? AND tutee_id = ?',
                [rating, limitedFeedback, tutor_id, tutee_id]
            );
        } else {
            await db.query(
                'INSERT INTO reviews (tutor_id, tutee_id, rating, feedback, review_date) VALUES (?, ?, ?, ?, NOW())',
                [tutor_id, tutee_id, rating, limitedFeedback]
            );
        }

        // Recalculate rating and points for the tutor
        const tutor = new Tutor(tutor_id);
        await tutor.calculateAvgRating();
        await tutor.calculatePoints();

        res.redirect(`/tutor/${tutor_id}`);

    } catch (err) {
        console.error("Review error:", err);
        res.status(500).send("Error saving review");
    }
});

/**
 * POST /tutor/:id/flag
 * Student flags (or unflags) a tutor for moderation.
 */
router.post("/tutor/:id/flag", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutee') {
        return res.status(403).json({ success: false });
    }

    const tutor_id = req.params.id;
    const tutee_id = req.session.tuteeId;

    try {
        const existing = await db.query(
            'SELECT * FROM flagged_tutors WHERE tutor_id = ? AND tutee_id = ?',
            [tutor_id, tutee_id]
        );

        if (existing.length > 0) {
            await db.query(
                'DELETE FROM flagged_tutors WHERE tutor_id = ? AND tutee_id = ?',
                [tutor_id, tutee_id]
            );
            res.json({ action: 'removed' });
        } else {
            await db.query(
                'INSERT INTO flagged_tutors (tutor_id, tutee_id) VALUES (?, ?)',
                [tutor_id, tutee_id]
            );
            res.json({ action: 'added' });
        }
    } catch (err) {
        console.error("Flag error:", err);
        res.status(500).json({ success: false });
    }
});

/**
 * POST /tutor/:id/favorite
 * Student adds or removes a tutor from their favorites.
 */
router.post("/tutor/:id/favorite", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutee') {
        return res.status(403).json({ success: false });
    }

    const tutor_id = req.params.id;
    const tutee_id = req.session.tuteeId;

    try {
        const existing = await db.query(
            'SELECT * FROM favourites_tutors WHERE tutor_id = ? AND tutee_id = ?',
            [tutor_id, tutee_id]
        );

        if (existing.length > 0) {
            await db.query(
                'DELETE FROM favourites_tutors WHERE tutor_id = ? AND tutee_id = ?',
                [tutor_id, tutee_id]
            );
            res.json({ action: 'removed' });
        } else {
            await db.query(
                'INSERT INTO favourites_tutors (tutor_id, tutee_id) VALUES (?, ?)',
                [tutor_id, tutee_id]
            );
            res.json({ action: 'added' });
        }
    } catch (err) {
        console.error("Favorite error:", err);
        res.status(500).json({ success: false });
    }
});

/**
 * POST /booking/cancel
 * Student cancels one of their own bookings.
 */
router.post("/booking/cancel", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutee') {
        return res.status(403).send("Unauthorized");
    }

    const { booking_id } = req.body;

    try {
        await Booking.cancel(booking_id, req.session.tuteeId);
        res.redirect("/dashboard/tutee");
    } catch (err) {
        console.error("Cancel error:", err);
        res.status(500).send("Error cancelling booking");
    }
});

module.exports = router;