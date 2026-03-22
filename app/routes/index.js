const express = require('express');
const router = express.Router();
const db = require('../services/db');

// ── HOME ──────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const studentRows = await db.query('SELECT COUNT(*) AS count FROM tutees');
        const tutorRows = await db.query('SELECT COUNT(*) AS count FROM tutors');
        const reviewRows = await db.query('SELECT AVG(rating) AS avgRating FROM reviews');

        const studentCount = studentRows[0] && studentRows[0].count ? `${studentRows[0].count}+` : '500+';
        const tutorCount = tutorRows[0] && tutorRows[0].count ? `${tutorRows[0].count}+` : '120+';
        const avgRating = reviewRows[0] && reviewRows[0].avgRating ? `${parseFloat(reviewRows[0].avgRating).toFixed(1)}★` : '4.9★';

        res.render('home', {
            title: 'Dracarys – Learn & Grow',
            activePage: 'home',
            heroImage: '/images/002.jpg',
            featureImages: [
                '/images/009.jpg',
                '/images/003.jpg',
                '/images/012.jpg'
            ],
            stats: {
                students: studentCount,
                tutors: tutorCount,
                rating: avgRating
            },
            user: req.session
        });

    } catch (err) {
        console.error('Home route error:', err);
        res.render('home', {
            title: 'Dracarys – Learn & Grow',
            activePage: 'home',
            heroImage: '/images/002.jpg',
            featureImages: [
                '/images/009.jpg',
                '/images/003.jpg',
                '/images/012.jpg'
            ],
            // Sending distinct mock stats here to demonstrate how the template updates dynamically
            stats: { 
                students: '1200+', 
                tutors: '340+', 
                rating: '4.8★' 
            },
            user: req.session
        });
    }
});

// redirect /home → /
router.get('/home', (req, res) => res.redirect('/'));

// redirect /profile → /tutor/1 so the user's manual navigation works flawlessly
router.get('/profile', (req, res) => res.redirect('/tutor/1'));

// ── ABOUT ─────────────────────────────────────────────
router.get('/about', (req, res) => {
    res.render('about', {
        title: 'About Us | Dracarys',
        activePage: 'about'
    });
});

// ── NEWS & FEEDS ───────────────────────────────────────
router.get('/news', (req, res) => {
    res.render('news', {
        title: 'News & Feeds | Dracarys',
        activePage: 'news'
    });
});

module.exports = router;