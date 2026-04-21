const requireLogin = (req, res, next) => {
    if (!req.session.loggedIn) {
        return res.redirect('/login?error=Please login to access this feature');
    }
    next();
};

const isTutor = (req, res, next) => {
    if (!req.session.loggedIn || req.session.role !== 'tutor') {
        return res.redirect('/');
    }
    next();
};

const isTutee = (req, res, next) => {
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
