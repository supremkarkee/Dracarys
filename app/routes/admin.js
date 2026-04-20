const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { User } = require('../models/users');

// Middleware to protect all admin routes
router.use((req, res, next) => {
    if (!req.session.uid || req.session.role !== 'admin') {
        return res.redirect('/login');
    }
    next();
});

// GET /admin/dashboard
router.get("/dashboard", async function (req, res) {
    try {
        const user = new User();
        user.userId = req.session.uid;
        await user.getDetails();

        const tutors = await db.query(`
            SELECT u.user_id, u.first_name, u.last_name, u.email, t.status 
            FROM users u 
            JOIN tutors t ON u.user_id = t.user_id
        `);
        const activeTutors = tutors.filter(t => t.status === 'active' || !t.status);
        const flaggedTutors = tutors.filter(t => t.status === 'flagged');
        
        res.render("admin-dashboard", { 
            loggedIn: req.session.loggedIn, 
            user,
            activeTutors, 
            flaggedTutors 
        });
    } catch (err) {
        if (err.message.includes("Unknown column")) {
            const user = new User();
            user.userId = req.session.uid;
            await user.getDetails();

            const tutorsFallback = await db.query(`
                SELECT u.user_id, u.first_name, u.last_name, u.email 
                FROM users u 
                JOIN tutors t ON u.user_id = t.user_id
            `);
            res.render("admin-dashboard", { 
                loggedIn: req.session.loggedIn, 
                user,
                activeTutors: tutorsFallback, 
                flaggedTutors: [] 
            });
        }
        else res.status(500).send("Database Error");
    }
});

// GET /admin/users
router.get("/users", function (req, res) {
    res.render("admin-users", { loggedIn: req.session.loggedIn });
});

// POST /admin/create-admin
router.post('/create-admin', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const exists = await User.checkUserExists(email);
        if (exists) return res.send("Admin account already exists!");
        const adminData = { firstName, lastName, email, password, role: 'admin' };
        await User.createUser(adminData);
        res.redirect('/admin/dashboard');
    } catch (err) {
        res.status(500).send("Error creating admin");
    }
});

// POST /admin/users/delete/:id
router.post('/users/delete/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        const tutees = await db.query("SELECT tutee_id FROM tutees WHERE user_id = ?", [userId]);
        for (const t of tutees) {
            await db.query("DELETE FROM reviews WHERE tutee_id = ?", [t.tutee_id]);
            await db.query("DELETE FROM tutee_subjects WHERE tutee_id = ?", [t.tutee_id]);
        }
        
        const tutors = await db.query("SELECT tutor_id FROM tutors WHERE user_id = ?", [userId]);
        for (const t of tutors) {
            await db.query("DELETE FROM reviews WHERE tutor_id = ?", [t.tutor_id]);
            await db.query("DELETE FROM tutor_subjects WHERE tutor_id = ?", [t.tutor_id]);
        }
        
        await db.query("DELETE FROM tutees WHERE user_id = ?", [userId]);
        await db.query("DELETE FROM tutors WHERE user_id = ?", [userId]);
        await db.query("DELETE FROM users WHERE user_id = ?", [userId]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
