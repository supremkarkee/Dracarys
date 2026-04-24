/**
 * Dashboard Controller
 * 
 * This file handles the main dashboard for every user type (tutor, tutee, admin).
 * It redirects users to the correct dashboard based on their role and includes
 * profile editing, subject management, booking actions, and stats.
 */

const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { Booking } = require('../models/Booking');
const { Tutor } = require('../models/Tutor');
const { Tutee } = require('../models/Tutee');
const { Subject } = require('../models/Subject');

const { requireLogin: isLoggedIn } = require('../middleware/auth');

/**
 * GET /dashboard
 * Main dashboard entry point.
 * It looks at the user's role and redirects them to the correct dashboard.
 */
router.get('/dashboard', isLoggedIn, (req, res) => {
    const role = req.session.role;

    if (role === 'tutor') {
        return res.redirect('/dashboard/tutor');
    } else if (role === 'tutee') {
        return res.redirect('/dashboard/tutee');
    } else if (role === 'admin') {
        return res.redirect('/dashboard/admin');
    }

    res.redirect('/');
});

/**
 * GET /dashboard/tutor
 * Shows the tutor dashboard with bookings, students, profile, reviews, and stats.
 */
router.get('/dashboard/tutor', isLoggedIn, async (req, res) => {
    if (req.session.role !== 'tutor') {
        return res.status(403).send('Access Denied: Only tutors can access this page');
    }

    // Safety check: make sure the tutor ID is in the session
    if (!req.session.tutorId) {
        console.error('Tutor dashboard: tutorId missing from session for userId:', req.session.userId);
        return res.redirect('/logout');
    }

    try {
        const bookings = await Booking.getByTutor(req.session.tutorId);
        const students = await Tutee.getByTutor(req.session.tutorId);

        // Load full tutor profile, reviews, and rating using the Tutor model
        const tutorProfile = new Tutor(req.session.tutorId);
        await tutorProfile.getTutorDetails();
        const reviews = await tutorProfile.getReviews();
        const avgRating = await tutorProfile.calculateAvgRating();

        const points = tutorProfile.points || 0;
        const totalLessons = tutorProfile.lesson_count || bookings.length;

        res.render('DashboardTutor', { 
            title: 'Tutor Dashboard - Dracarys', 
            activePage: 'dashboard',
            user: res.locals.user,
            tutorProfile: tutorProfile,
            bookings: bookings || [],
            students: students || [],
            reviews: reviews || [],
            success: req.query.success,
            error: req.query.error,
            stats: {
                students: students.length,
                lessons: totalLessons,
                rating: avgRating,
                reviewCount: reviews.length
            }
        });

    } catch (err) {
        console.error('Tutor dashboard error:', err);
        res.redirect('/dashboard/tutor?error=Failed to load dashboard data');
    }
});

/**
 * POST /dashboard/tutor/profile
 * Updates a tutor's description, qualifications, and languages.
 */
router.post('/dashboard/tutor/profile', isLoggedIn, async (req, res) => {
    if (req.session.role !== 'tutor') {
        return res.status(403).send('Access Denied: Only tutors can perform this action');
    }

    const { description, qualification, languages } = req.body;

    try {
        await Tutor.updateProfile(req.session.tutorId, description, qualification, languages);
        res.redirect('/dashboard/tutor?success=Profile updated successfully');
    } catch (err) {
        console.error("Error updating tutor profile:", err);
        res.redirect('/dashboard/tutor?error=Failed to update profile');
    }
});

/**
 * POST /dashboard/tutor/booking/complete
 * Marks a booking as completed (used by tutors).
 */
router.post('/dashboard/tutor/booking/complete', isLoggedIn, async (req, res) => {
    if (req.session.role !== 'tutor') {
        return res.status(403).send('Access Denied');
    }

    const { booking_id } = req.body;

    try {
        await Booking.complete(booking_id);
        res.redirect('/dashboard/tutor?success=Lesson marked as completed!');
    } catch (err) {
        console.error("Error completing booking:", err);
        res.redirect('/dashboard/tutor?error=Failed to complete lesson');
    }
});

/**
 * POST /dashboard/tutor/subject/add
 * Adds a new subject that the tutor teaches.
 */
router.post('/dashboard/tutor/subject/add', isLoggedIn, async (req, res) => {
    if (req.session.role !== 'tutor') {
        return res.status(403).send('Access Denied: Only tutors can perform this action');
    }

    const { subject_name } = req.body;

    try {
        await Subject.addTutorSubject(req.session.tutorId, subject_name);
        res.redirect('/dashboard/tutor?success=Subject added successfully');
    } catch (err) {
        console.error("Error adding tutor subject:", err);
        res.redirect('/dashboard/tutor?error=Failed to add subject');
    }
});

/**
 * POST /dashboard/tutor/subject/remove
 * Removes a subject that the tutor teaches.
 */
router.post('/dashboard/tutor/subject/remove', isLoggedIn, async (req, res) => {
    if (req.session.role !== 'tutor') {
        return res.status(403).send('Access Denied: Only tutors can perform this action');
    }

    const { subject_name } = req.body;

    try {
        await Subject.removeTutorSubject(req.session.tutorId, subject_name);
        res.redirect('/dashboard/tutor?success=Subject removed successfully');
    } catch (err) {
        console.error("Error removing tutor subject:", err);
        res.redirect('/dashboard/tutor?error=Failed to remove subject');
    }
});

/**
 * GET /dashboard/tutee
 * Shows the student dashboard with bookings and education profile.
 */
router.get('/dashboard/tutee', isLoggedIn, async (req, res) => {
    if (req.session.role !== 'tutee') {
        return res.status(403).send('Access Denied: Only students can access this page');
    }

    // Safety check: make sure the tutee ID is in the session
    if (!req.session.tuteeId) {
        console.error('Tutee dashboard: tuteeId missing from session for userId:', req.session.userId);
        return res.redirect('/logout');
    }

    try {
        const bookings = await Booking.getByTutee(req.session.tuteeId);

        // Load the student's full profile (school level, grade level)
        const tutee = new Tutee(req.session.tuteeId);
        await tutee.getTuteeDetails();

        const uniqueTutors = new Set(bookings.map(b => b.tutor_id)).size;

        res.render('DashboardTutee', { 
            title: 'Student Dashboard - Dracarys', 
            activePage: 'dashboard',
            user: res.locals.user,
            tuteeProfile: tutee,
            bookings: bookings || [],
            success: req.query.success,
            error: req.query.error,
            stats: {
                tutors: uniqueTutors,
                lessons: bookings.length
            }
        });

    } catch (err) {
        console.error('Tutee dashboard error:', err);
        res.redirect('/dashboard/tutee?error=Failed to load dashboard data');
    }
});

/**
 * POST /dashboard/tutee/education
 * Updates a student's school level and grade level.
 */
router.post('/dashboard/tutee/education', isLoggedIn, async (req, res) => {
    if (req.session.role !== 'tutee') {
        return res.status(403).send('Access Denied: Only students can perform this action');
    }

    const { school_level, grade_level } = req.body;

    try {
        await Tutee.updateEducation(req.session.tuteeId, school_level, grade_level);
        res.redirect('/dashboard/tutee?success=Education profile updated successfully');
    } catch (err) {
        console.error('Error updating tutee education:', err);
        res.redirect('/dashboard/tutee?error=Failed to update education profile');
    }
});

/**
 * GET /dashboard/admin
 * Shows the admin dashboard with overall platform statistics.
 */
router.get('/dashboard/admin', isLoggedIn, async (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).send('Access Denied: Only admins can access this page');
    }

    try {
        const userCount = await db.query('SELECT COUNT(*) as count FROM users');
        const tutorCount = await db.query('SELECT COUNT(*) as count FROM tutors');
        const studentCount = await db.query('SELECT COUNT(*) as count FROM tutees');
        const flaggedCount = await db.query('SELECT COUNT(DISTINCT tutor_id) as count FROM flagged_tutors');

        res.render('DashboardAdmin', { 
            title: 'Admin Dashboard - Dracarys', 
            activePage: 'dashboard',
            user: res.locals.user,
            stats: {
                users: userCount[0].count,
                tutors: tutorCount[0].count,
                students: studentCount[0].count,
                flagged: flaggedCount[0].count
            }
        });

    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).send('Failed to load admin dashboard');
    }
});

module.exports = router;