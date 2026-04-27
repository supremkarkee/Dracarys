const { User } = require('../app/models/User');
const db = require('../app/services/db');

async function addAdmin() {
    try {
        const fullName = 'System Admin';
        const email = 'admin@dracarys.com';
        const password = 'AdminPassword123';
        const role = 'admin';

        // Check if user already exists
        const existing = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log(`User with email ${email} already exists.`);
            process.exit(0);
        }

        const userId = await User.register(fullName, email, password, role);
        console.log(`Admin user created successfully with ID: ${userId}`);
        process.exit(0);
    } catch (err) {
        console.error('Error adding admin user:', err);
        process.exit(1);
    }
}

addAdmin();
