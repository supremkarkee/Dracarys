const express = require('express');
const router = express.Router();
// Import the new Class-based User model
const { User } = require('../models/user');

// POST route to handle form submission from signup.pug
router.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, userId, email, password, role } = req.body;

        // Combine first and last name into full_name as per DB schema
        const fullName = `${firstName.trim()} ${lastName.trim()}`;

        // Basic validation
        if (!firstName || !lastName || !userId || !email || !password || !role) {
            return res.status(400).send("All fields are required.");
        }

        // Use the static class method to check if user already exists
        const userExists = await User.checkUserExists(email, userId);
        if (userExists) {
            return res.status(409).send("An account with this Email or User ID already exists.");
        }

        // Use the static class method to create the new user
        const userData = { fullName, userId, email, password, role };
        const newUser = await User.createUser(userData);

        // Success - log and redirect to login
        console.log(`New ${role} registered with Database ID: ${newUser.id}`);
        res.redirect('/login?success=true');

    } catch (error) {
        console.error("Signup Route Error:", error);
        res.status(500).send("An internal server error occurred during registration. Please try again later.");
    }
});

module.exports = router;
