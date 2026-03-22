/**
 * Authentication middleware
 * Use these on any route that requires the user to be logged in.
 */

/**
 * Blocks unauthenticated users and redirects them to /login
 */
function requireLogin(req, res, next) {
    if (req.session && req.session.loggedIn) {
        return next();
    }
    res.redirect('/login');
}

/**
 * Restricts a route to tutors only
 */
function requireTutor(req, res, next) {
    if (req.session && req.session.loggedIn && req.session.role === 'tutor') {
        return next();
    }
    res.status(403).redirect('/');
}

/**
 * Restricts a route to tutees only
 */
function requireTutee(req, res, next) {
    if (req.session && req.session.loggedIn && req.session.role === 'tutee') {
        return next();
    }
    res.status(403).redirect('/');
}

module.exports = { requireLogin, requireTutor, requireTutee };
