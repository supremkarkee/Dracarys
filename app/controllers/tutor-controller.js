const express = require('express');
const router  = express.Router();
const { Tutor } = require('../models/Tutor');
const { Booking } = require('../models/Booking');
const { Subject } = require('../models/Subject');
const db = require('../services/db');
const { requireLogin } = require('../middleware/auth');

// ==================== BROWSE/SEARCH TUTORS ====================
router.get("/browse/tutors", async function (req, res) {
    try {
        const query = req.query.q || '';
        const subjectFilter = req.query.subject || 'all';
        const languageFilter = req.query.lang || 'all';
        const flaggedOnly = req.query.flagged === 'true';
        const favoritesOnly = req.query.favorites === 'true';
        
        // Fetch all subjects for the filter sidebar
        const subjects = await Subject.getAll();
        
        // Fetch unique languages from DB for filter (or use static list for cleaner UI)
        const langResult = await db.query("SELECT DISTINCT languages FROM tutors WHERE languages IS NOT NULL");
        const allLangsSet = new Set();
        langResult.forEach(row => {
            row.languages.split(',').forEach(l => allLangsSet.add(l.trim()));
        });
        const languages = Array.from(allLangsSet).sort();

        // Search logic delegated to Tutor model
        const tutors = await Tutor.search(
            query, 
            subjectFilter, 
            flaggedOnly, 
            req.session.tuteeId,
            languageFilter,
            favoritesOnly
        );

        res.render("search", { 
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
            role: req.session.role // Passed for UI conditional rendering
        });
    } catch (err) {
        console.error("Failed to load tutors:", err);
        res.render("search", { 
            title: "Search Tutors", 
            data: [], 
            subjects: [],
            selectedSubject: 'all',
            activePage: "search" 
        });
    }
});

// Legacy redirect
router.get("/tutors", (req, res) => res.redirect("/browse/tutors"));

// ==================== TUTOR PROFILE ====================
router.get("/tutor/:id", async function (req, res) {
    try {
        const tutor = new Tutor(req.params.id);
        await tutor.getTutorDetails();
        await tutor.getReviews();

        if (tutor.full_name) {
            let existingBooking = null;
            let isFlagged = false;
            let isFavorite = false;
            
            if (req.session.loggedIn && req.session.role === 'tutee') {
                existingBooking = await Booking.checkExisting(req.session.tuteeId, tutor.tutor_id);
                
                const flagCheck = await db.query('SELECT * FROM flagged_tutors WHERE tutor_id = ? AND tutee_id = ?', [tutor.tutor_id, req.session.tuteeId]);
                isFlagged = flagCheck.length > 0;

                const favCheck = await db.query('SELECT * FROM favourites_tutors WHERE tutor_id = ? AND tutee_id = ?', [tutor.tutor_id, req.session.tuteeId]);
                isFavorite = favCheck.length > 0;
            }

            res.render("profile", {
                title: tutor.full_name + " - Profile",
                tutor,
                existingBooking,
                isFlagged,
                isFavorite,
                role: req.session.role,
                loggedIn: req.session.loggedIn
            });
        } else {
            res.status(404).render("404", { title: "Tutor Not Found" });
        }
    } catch (err) {
        console.error('Tutor profile error:', err);
        res.status(500).render("404", { title: "Error loading tutor profile" });
    }
});

// ==================== BOOKING SYSTEM ====================
router.get("/book_lesson/:id", requireLogin, async function (req, res) {
    try {
        if (req.session.role !== 'tutee') {
            return res.status(403).send("Only students can book lessons");
        }

        const tutor = new Tutor(req.params.id);
        await tutor.getTutorDetails();
        
        // Only load subjects that this specific tutor teaches
        let subjects = [];
        if (tutor.subjects && tutor.subjects.length > 0) {
            subjects = tutor.subjects.map(s => ({ subject_name: s }));
        } else {
            subjects = await db.query('SELECT * FROM subjects'); // fallback if none found
        }

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

router.post("/book/:id", requireLogin, async function (req, res) {
    try {
        if (req.session.role !== 'tutee') {
            return res.status(403).send("Only students can book lessons");
        }

        const tutee_id = req.session.tuteeId;
        const tutor_id = req.params.id;

        const existing = await Booking.checkExisting(tutee_id, tutor_id);
        if (existing) {
            return res.redirect(`/tutor/${tutor_id}?error=Already booked`);
        }

        const { date, time, end_time, subject_name } = req.body;

        const start = new Date(`1970-01-01T${time}`);
        const end = new Date(`1970-01-01T${end_time}`);
        const durationHours = (end - start) / (1000 * 60 * 60);

        if (durationHours < 1 || durationHours > 3) {
            return res.status(400).send("Lesson must be between 1 and 3 hours.");
        }

        await Booking.create(tutee_id, tutor_id, date, time, end_time, subject_name);
        res.render("booking_success", { title: "Booking Successful", activePage: "search", tutorId: tutor_id });
    } catch (err) {
        console.error("Booking error:", err);
        res.status(500).send("Internal Server Error");
    }
});

// ==================== TUTOR DASHBOARD ====================
router.post("/booking/respond", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutor') return res.status(403).send("Unauthorized");
    const { booking_id, status, message } = req.body;
    try {
        await Booking.updateStatus(booking_id, status, message);
        res.redirect("/dashboard/tutor");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating booking status");
    }
});

// ==================== Tutee Actions (Review, Favorite, Cancel) ====================
router.post("/tutor/:id/review", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutee') return res.status(403).send("Only students can leave reviews");
    const tutor_id = req.params.id;
    const tutee_id = req.session.tuteeId;
    const { rating, feedback } = req.body;

    try {
        // Enforce 200 word limit server-side too
        const limitedFeedback = feedback.split(' ').slice(0, 200).join(' ');
        
        const existing = await db.query('SELECT * FROM reviews WHERE tutor_id = ? AND tutee_id = ?', [tutor_id, tutee_id]);
        if (existing.length > 0) {
            await db.query('UPDATE reviews SET rating = ?, feedback = ?, review_date = NOW() WHERE tutor_id = ? AND tutee_id = ?', [rating, limitedFeedback, tutor_id, tutee_id]);
        } else {
            await db.query('INSERT INTO reviews (tutor_id, tutee_id, rating, feedback, review_date) VALUES (?, ?, ?, ?, NOW())', [tutor_id, tutee_id, rating, limitedFeedback]);
        }
        res.redirect(`/tutor/${tutor_id}`);
    } catch (err) {
        console.error("Review error:", err);
        res.status(500).send("Error saving review");
    }
});

router.post("/tutor/:id/flag", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutee') return res.status(403).json({ success: false });
    const tutor_id = req.params.id;
    const tutee_id = req.session.tuteeId;
    try {
        const existing = await db.query('SELECT * FROM flagged_tutors WHERE tutor_id = ? AND tutee_id = ?', [tutor_id, tutee_id]);
        if (existing.length > 0) {
            await db.query('DELETE FROM flagged_tutors WHERE tutor_id = ? AND tutee_id = ?', [tutor_id, tutee_id]);
            res.json({ action: 'removed' });
        } else {
            await db.query('INSERT INTO flagged_tutors (tutor_id, tutee_id) VALUES (?, ?)', [tutor_id, tutee_id]);
            res.json({ action: 'added' });
        }
    } catch (err) {
        console.error("Flag error:", err);
        res.status(500).json({ success: false });
    }
});

router.post("/tutor/:id/favorite", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutee') return res.status(403).json({ success: false });
    const tutor_id = req.params.id;
    const tutee_id = req.session.tuteeId;
    try {
        const existing = await db.query('SELECT * FROM favourites_tutors WHERE tutor_id = ? AND tutee_id = ?', [tutor_id, tutee_id]);
        if (existing.length > 0) {
            await db.query('DELETE FROM favourites_tutors WHERE tutor_id = ? AND tutee_id = ?', [tutor_id, tutee_id]);
            res.json({ action: 'removed' });
        } else {
            await db.query('INSERT INTO favourites_tutors (tutor_id, tutee_id) VALUES (?, ?)', [tutor_id, tutee_id]);
            res.json({ action: 'added' });
        }
    } catch (err) {
        console.error("Favorite error:", err);
        res.status(500).json({ success: false });
    }
});

router.post("/booking/cancel", requireLogin, async function (req, res) {
    if (req.session.role !== 'tutee') return res.status(403).send("Unauthorized");
    const { booking_id } = req.body;
    try {
        await db.query('DELETE FROM bookings WHERE booking_id = ? AND tutee_id = ?', [booking_id, req.session.tuteeId]);
        res.redirect("/dashboard/tutee");
    } catch (err) {
        console.error("Cancel error:", err);
        res.status(500).send("Error cancelling booking");
    }
});

module.exports = router;
