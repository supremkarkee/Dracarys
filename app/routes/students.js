const express = require('express');
const router = express.Router();
const { Student } = require('../models/Student');

router.get("/all-student", function (req, res) {
    res.redirect("/students");
});

router.get("/students", function (req, res) {
    Student.getAll().then(results => {
        res.render("all-student", { title: "Our Students", data: results });
    });
});

module.exports = router;
