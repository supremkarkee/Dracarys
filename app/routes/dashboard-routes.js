const express = require('express');
const router = express.Router();

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
router.get('/dashboard/tutor', isLoggedIn, (req, res) => {
    if (req.session.role !== 'tutor') {
        return res.status(403).send('Access Denied: Only tutors can access this page');
    }
    res.render('dashboard-tutor', { 
        title: 'Tutor Dashboard - Dracarys', 
        activePage: 'dashboard',
        user: res.locals.user
    });
});

// Tutee (Student) Dashboard
router.get('/dashboard/tutee', isLoggedIn, (req, res) => {
    if (req.session.role !== 'tutee') {
        return res.status(403).send('Access Denied: Only students can access this page');
    }
    res.render('dashboard-tutee', { 
        title: 'Student Dashboard - Dracarys', 
        activePage: 'dashboard',
        user: res.locals.user
    });
});

// Admin Dashboard
router.get('/dashboard/admin', isLoggedIn, (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).send('Access Denied: Only admins can access this page');
    }
    res.render('dashboard-admin', { 
        title: 'Admin Dashboard - Dracarys', 
        activePage: 'dashboard',
        user: res.locals.user
    });
});

module.exports = router;
