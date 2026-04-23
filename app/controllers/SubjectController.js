/**
 * Subjects Controller
 * 
 * This file handles the public subjects page that shows
 * all the available tutoring subjects/categories on the platform.
 * Anyone can view this page (no login required).
 */

const express = require('express');
const router = express.Router();
const { Subject } = require('../models/Subject');

/**
 * GET /subjects
 * Displays a list of all subjects that tutors can teach on Dracarys.
 */
router.get("/subjects", async function (req, res) {
    try {
        const subjects = await Subject.getAll();

        res.render("Subjects", { 
            title: "Our Subjects", 
            data: subjects 
        });

    } catch (err) {
        console.error("Failed to load subjects:", err);
        res.status(500).render("Error404", { 
            title: "Error loading subjects" 
        });
    }
});

module.exports = router;