const db = require('./app/services/db');

async function updateSchema() {
    try {
        console.log('Updating bookings table status enum...');
        await db.query("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'accepted', 'declined', 'completed') DEFAULT 'pending'");
        console.log('Schema updated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error updating schema:', err);
        process.exit(1);
    }
}

updateSchema();
