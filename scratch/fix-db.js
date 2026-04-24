const db = require('../app/services/db');

async function fix() {
    try {
        console.log("Updating bookings table status enum...");
        await db.query(`
            ALTER TABLE bookings 
            MODIFY COLUMN status ENUM('pending', 'accepted', 'declined', 'completed') DEFAULT 'pending'
        `);
        console.log("Database updated successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Failed to update database:", err);
        process.exit(1);
    }
}

fix();
