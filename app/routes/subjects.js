const express = require('express');
const router  = express.Router();
const { Subject } = require('../models/Subject');

router.get("/subjects", async function (req, res) {
    try {
        const results = await Subject.getAll();
        res.render("subjects", { title: "Our Subjects", data: results });
    } catch (err) {
        console.error("Failed to load subjects:", err);
        res.status(500).render("404", { title: "Error loading subjects" });
    }
});

module.exports = router;
