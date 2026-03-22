const db = require('./app/services/db');
const { User } = require('./app/models/users');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        console.log("Altering 'users' table to support 'admin' role...");
        await db.query("ALTER TABLE users MODIFY COLUMN role enum('tutor','tutee','admin') NOT NULL");
        console.log("Role 'admin' added successfully.");

        const email = 'admin@dracarys.com';
        const password = 'adminpassword123';

        const exists = await User.checkUserExists(email);
        if (exists) {
            console.log("Admin account already exists!");
        } else {
            console.log("Creating admin account...");
            const adminData = {
                firstName: 'Master',
                lastName: 'Admin',
                email: email,
                password: password,
                role: 'admin'
            };
            const newUser = await User.createUser(adminData);
            console.log(`Admin account created with email: ${email} and password: ${password}`);
        }
    } catch (err) {
        console.error("Error setting up admin account:", err);
    } finally {
        process.exit();
    }
}

createAdmin();
