const express = require('express');
const router = express.Router();
// Import the new Class-based User model
const { User } = require('../models/users');

// POST route to handle form submission from signup.pug
router.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        // Basic validation
        if (!firstName || !lastName || !email || !password || !role) {
            console.log("All fields are required");
            return res.status(400).send("All fields are required.");
        }

        // Use the static class method to check if user already exists
        const userExists = await User.checkUserExists(email);
        if (userExists) {
            console.log("Account already exists");
            return res.redirect('/login?account_exists=true');
        }

        // Use the static class method to create the new user
        const userData = { firstName: firstName.trim(), lastName: lastName.trim(), email, password, role };
        const newUser = await User.createUser(userData);

        // Success - log and redirect to login
        console.log(`New ${role} registered successfully with email: ${email}`);
        return res.redirect('/login?registered=true');

    } catch (error) {
        console.error("Signup Route Error:", error);
        res.status(500).send("An internal server error occurred during registration. Please try again later.");
    }
});

module.exports = router;
