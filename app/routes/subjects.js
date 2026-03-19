const express = require('express');
const router = express.Router();
const { Subject } = require('../models/Subject');

router.get("/subjects", function (req, res) {
    Subject.getAll().then(results => {
        res.render("subjects", { title: "Our Subjects", data: results });
    });
});

module.exports = router;
