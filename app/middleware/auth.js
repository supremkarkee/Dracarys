/**
 * Auth Middleware
 * 
 * This file contains reusable middleware functions for authentication and role checking.
 * These run before certain routes to make sure the user is logged in and has the right role.
 */

const requireLogin = (req, res, next) => {
    // If the user is not logged in, send them to login with a helpful message
    if (!req.session.loggedIn) {
        return res.redirect('/login?error=Please login to access this feature');
    }

    next();
};

const isTutor = (req, res, next) => {
    // Only allow access if the user is logged in AND is a tutor
    if (!req.session.loggedIn || req.session.role !== 'tutor') {
        return res.redirect('/');
    }

    next();
};

const isTutee = (req, res, next) => {
    // Only allow access if the user is logged in AND is a tutee (student)
    if (!req.session.loggedIn || req.session.role !== 'tutee') {
        return res.redirect('/');
    }

    next();
};

module.exports = {
    requireLogin,
    isTutor,
    isTutee
};