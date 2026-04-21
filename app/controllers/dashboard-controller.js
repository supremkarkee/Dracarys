const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { Booking } = require('../models/Booking');
const { Tutor } = require('../models/Tutor');
const { Tutee } = require('../models/Tutee');

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (!req.session.loggedIn) {
        return res.redirect('/login?error=Please login to access dashboard');
    }
    next();
};

// Route to main dashboard (redirects based on role)
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

// Tutor Dashboard
router.get('/dashboard/tutor', isLoggedIn, async (req, res) => {
    if (req.session.role !== 'tutor') {
        return res.status(403).send('Access Denied: Only tutors can access this page');
    }
    const bookings = await Booking.getByTutor(req.session.tutorId);
    const students = await Tutee.getByTutor(req.session.tutorId);
    
    // Calculate stats
    const uniqueStudents = students.length;
    
    // Fetch tutor specific data (like points)
    const tutorData = await db.query('SELECT points, lesson_count FROM tutors WHERE tutor_id = ?', [req.session.tutorId]);
    const points = tutorData.length > 0 ? tutorData[0].points : 0;
    const totalLessons = tutorData.length > 0 ? tutorData[0].lesson_count : bookings.length;

    res.render('dashboard-tutor', { 
        title: 'Tutor Dashboard - Dracarys', 
        activePage: 'dashboard',
        user: res.locals.user,
        bookings: bookings || [],
        students: students || [],
        stats: {
            students: uniqueStudents,
            lessons: totalLessons,
            points: points
        }
    });
});

// Tutee (Student) Dashboard
router.get('/dashboard/tutee', isLoggedIn, async (req, res) => {
    if (req.session.role !== 'tutee') {
        return res.status(403).send('Access Denied: Only students can access this page');
    }
    const bookings = await Booking.getByTutee(req.session.tuteeId);
    
    // Calculate stats
    const uniqueTutors = new Set(bookings.map(b => b.tutor_id)).size;
    const totalLessons = bookings.length;

    res.render('dashboard-tutee', { 
        title: 'Student Dashboard - Dracarys', 
        activePage: 'dashboard',
        user: res.locals.user,
        bookings: bookings || [],
        stats: {
            tutors: uniqueTutors,
            lessons: totalLessons
        }
    });
});

// Admin Dashboard
router.get('/dashboard/admin', isLoggedIn, async (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).send('Access Denied: Only admins can access this page');
    }
    
    // Fetch counts for admin cards
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    const tutorCount = await db.query('SELECT COUNT(*) as count FROM tutors');
    const studentCount = await db.query('SELECT COUNT(*) as count FROM tutees');
    const flaggedCount = await db.query('SELECT COUNT(DISTINCT tutor_id) as count FROM flagged_tutors');

    res.render('dashboard-admin', { 
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
});

module.exports = router;
