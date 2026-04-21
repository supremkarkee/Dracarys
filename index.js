"use strict";

// Load environment variables FIRST — before anything else is imported.
require("dotenv").config();

const app = require("./app/app.js");

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log(`Server running at http://127.0.0.1:${PORT}/`);
});