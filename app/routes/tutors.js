const express = require('express');
const router = express.Router();
const { Tutor } = require('../models/Tutor');

router.get("/tutor", function (req, res) {
    res.redirect("/tutors");
});

router.get("/tutors", function (req, res) {
    Tutor.getAll().then(results => {
        res.render("tutor", { title: "Our Tutors", data: results, activePage: "search" });
    });
});

router.get("/tutor/:id", async function (req, res) {
    try {
        const tutor = new Tutor(req.params.id);
        await tutor.getTutorDetails();
        
        if (tutor.full_name) {
            res.render("profile", { title: tutor.full_name + " - Profile", tutor: tutor });
        } else {
            res.status(404).render("404", { title: "Tutor Not Found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
