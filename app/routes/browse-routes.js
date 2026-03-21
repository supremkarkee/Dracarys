const express = require('express');
const router = express.Router();
const { Tutor } = require('../models/Tutor');
const { Subject } = require('../models/Subject');
const db = require('../services/db');

// ==================== BROWSE TUTORS ====================
router.get("/browse/tutors", async function (req, res) {
    try {
        // If user is a tutor, redirect to their dashboard instead
        if (req.session.loggedIn && req.session.role === 'tutor') {
            return res.redirect('/dashboard/tutor?message=Tutors do not need to search for other tutors');
        }

        const query = req.query.q || '';
        const subjectFilter = req.query.subject || 'all';
        
        let sql = 'SELECT * FROM tutors JOIN users ON tutors.user_id = users.user_id';
        let params = [];
        
        if (query) {
            sql += ' WHERE (users.full_name LIKE ? OR tutors.subjects LIKE ?)';
            params.push(`%${query}%`, `%${query}%`);
        }
        
        if (subjectFilter !== 'all') {
            const condition = query ? ' AND' : ' WHERE';
            sql += `${condition} tutors.subjects LIKE ?`;
            params.push(`%${subjectFilter}%`);
        }
        
        const tutors = await db.query(sql, params);
        const subjects = await Subject.getAll();
        
        let selectedSubjectName = 'all';
        if (subjectFilter !== 'all') {
            const subj = subjects.find(s => s.subject_name === subjectFilter);
            selectedSubjectName = subj ? subj.subject_name : 'all';
        }
        
        console.log('Tutors loaded:', tutors.length);
        
        res.render("browse-tutors", { 
            title: "Browse Tutors", 
            data: tutors || [], 
            activePage: "browse-tutors",
            query: query,
            subjects: subjects || [],
            selectedSubject: selectedSubjectName,
            loggedIn: req.session.loggedIn || false
        });
    } catch (err) {
        console.error('Error loading tutors:', err);
        res.render("browse-tutors", { 
            title: "Browse Tutors", 
            data: [], 
            activePage: "browse-tutors",
            query: '',
            subjects: [],
            selectedSubject: 'all',
            error: 'Failed to load tutors',
            loggedIn: req.session.loggedIn || false
        });
    }
});

// Redirect old /tutors route to new /browse/tutors
router.get("/tutors", function (req, res) {
    res.redirect("/browse/tutors");
});

// ==================== TUTOR PROFILE & BOOKING ====================
router.get("/tutor/:id", async function (req, res) {
    try {
        const tutor = new Tutor(req.params.id);
        await tutor.getTutorDetails();
        
        if (tutor.full_name) {
            console.log('Tutor profile loaded:', tutor.full_name);
            res.render("profile", { 
                title: tutor.full_name + " - Profile", 
                tutor: tutor,
                loggedIn: req.session.loggedIn || false
            });
        } else {
            res.status(404).render("404", { title: "Tutor Not Found", loggedIn: req.session.loggedIn || false });
        }
    } catch (err) {
        console.error('Error loading tutor profile:', err);
        res.status(500).render("404", { title: "Error", message: "Could not load tutor profile", loggedIn: req.session.loggedIn || false });
    }
});

router.get("/book/:id", async function (req, res) {
    if (!req.session.loggedIn) {
        return res.redirect("/login?error=Please login to book a lesson");
    }
    
    try {
        const tutor = new Tutor(req.params.id);
        await tutor.getTutorDetails();
        
        if (!tutor.full_name) {
            return res.status(404).render("404", { title: "Tutor Not Found", loggedIn: req.session.loggedIn || false });
        }
        
        console.log('Booking lesson with:', tutor.full_name);
        
        res.render("booking_success", { 
            title: "Booking Successful", 
            message: `Your lesson with ${tutor.full_name} has been booked successfully!`,
            loggedIn: req.session.loggedIn || false
        });
    } catch (err) {
        console.error('Error booking lesson:', err);
        res.status(500).render("404", { title: "Error", message: "Could not book lesson", loggedIn: req.session.loggedIn || false });
    }
});

module.exports = router;
