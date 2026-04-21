require("dotenv").config();

const db = require('./app/services/db');
const { User } = require('./app/models/User');

async function createAdmin() {
    try {
        console.log("Setting up admin account...");
        
        const email = 'admin@dracarys.com';
        const password = 'adminpassword123';

        // Check if admin already exists
        const sql = 'SELECT * FROM users WHERE email = ?';
        const results = await db.query(sql, [email]);
        
        if (results.length > 0) {
            console.log("Admin account already exists!");
        } else {
            console.log("Creating admin account...");
            const userId = await User.register('Master Admin', email, password, 'admin');
            console.log(`✓ Admin account created successfully!`);
            console.log(`  Email: ${email}`);
            console.log(`  Password: ${password}`);
            console.log(`  User ID: ${userId}`);
        }
    } catch (err) {
        console.error("Error setting up admin account:", err);
    } finally {
        process.exit();
    }
}

createAdmin();
