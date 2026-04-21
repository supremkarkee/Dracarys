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

// redirect /profile → role-specific dashboard
router.get('/profile', (req, res) => {
    if (!req.session.loggedIn) return res.redirect('/login');
    const role = req.session.role;
    if (role === 'admin') return res.redirect('/dashboard/admin');
    if (role === 'tutor') return res.redirect('/dashboard/tutor');
    return res.redirect('/dashboard/tutee');
});

// ── ABOUT ─────────────────────────────────────────────
router.get('/about', (req, res) => {
    res.render('about', {
        title: 'About Us | Dracarys',
        activePage: 'about'
    });
});

// ── NEWS & FEEDS ───────────────────────────────────────
router.get('/news', async (req, res) => {
    try {
        const sql = `
            SELECT u.full_name, t.rating, t.description, t.tutor_id, t.points, t.lesson_count,
                   GROUP_CONCAT(s.subject_name SEPARATOR ', ') as subjects,
                   COUNT(DISTINCT r.review_id) as review_count
            FROM tutors t
            JOIN users u ON t.user_id = u.user_id
            LEFT JOIN tutor_subjects ts ON t.tutor_id = ts.tutor_id
            LEFT JOIN subjects s ON ts.subject_id = s.subject_id
            LEFT JOIN reviews r ON t.tutor_id = r.tutor_id
            GROUP BY t.tutor_id, u.full_name, t.rating, t.description, t.points, t.lesson_count
            ORDER BY review_count DESC, t.rating DESC
            LIMIT 1
        `;
        const results = await db.query(sql);
        let tutorOfWeek = null;
        if (results.length > 0) {
            const top = results[0];
            tutorOfWeek = {
                name: top.full_name,
                subject: top.subjects,
                rating: top.rating,
                review: '"' + top.description + '"',
                initials: top.full_name.charAt(0).toUpperCase(),
                points: top.points || 0,
                sessions: top.lesson_count || 0,
                badges: [
                    { type: 'top-rated', label: 'Top Rated' },
                    { type: 'fast-responder', label: 'Fast Responder' }
                ]
            };
        }

        res.render('news', {
            title: 'News & Feeds | Dracarys',
            activePage: 'news',
            tutorOfWeek
        });
    } catch (err) {
        console.error('Error fetching news:', err);
        res.render('news', {
            title: 'News & Feeds | Dracarys',
            activePage: 'news',
            tutorOfWeek: null
        });
    }
});

module.exports = router;