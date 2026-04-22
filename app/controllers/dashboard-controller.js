const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { Booking } = require('../models/Booking');
const { Tutor } = require('../models/Tutor');
const { Tutee } = require('../models/Tutee');
const { Subject } = require('../models/Subject');

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
    
    // Fetch full tutor specific data using the Tutor model
    const tutorProfile = new Tutor(req.session.tutorId);
    await tutorProfile.getTutorDetails();

    const points = tutorProfile.points || 0;
    const totalLessons = tutorProfile.lesson_count || bookings.length;

    res.render('dashboard-tutor', { 
        title: 'Tutor Dashboard - Dracarys', 
        activePage: 'dashboard',
        user: res.locals.user,
        tutorProfile: tutorProfile,
        bookings: bookings || [],
        students: students || [],
        success: req.query.success,
        error: req.query.error,
        stats: {
            students: uniqueStudents,
            lessons: totalLessons,
            points: points
        }
    });
});

// Update Tutor Profile
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

// Add Tutor Subject
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

// Remove Tutor Subject
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

// Tutee (Student) Dashboard
router.get('/dashboard/tutee', isLoggedIn, async (req, res) => {
    if (req.session.role !== 'tutee') {
        return res.status(403).send('Access Denied: Only students can access this page');
    }
    const bookings = await Booking.getByTutee(req.session.tuteeId);
    
    // Fetch the tutee's full profile (school_level, grade_level)
    const tutee = new Tutee(req.session.tuteeId);
    await tutee.getTuteeDetails();

    // Calculate stats
    const uniqueTutors = new Set(bookings.map(b => b.tutor_id)).size;
    const totalLessons = bookings.length;

    res.render('dashboard-tutee', { 
        title: 'Student Dashboard - Dracarys', 
        activePage: 'dashboard',
        user: res.locals.user,
        tuteeProfile: tutee,
        bookings: bookings || [],
        success: req.query.success,
        error: req.query.error,
        stats: {
            tutors: uniqueTutors,
            lessons: totalLessons
        }
    });
});

// Update Tutee Education Level
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
