const db = require('./services/db');

async function setupDB() {
    try {
        console.log("Checking and altering tutors table...");
        try {
            await db.query(`ALTER TABLE tutors ADD COLUMN availability ENUM('yes', 'no') DEFAULT 'yes' AFTER lesson_count;`);
            console.log("Added availability column.");
        } catch(e) {
            console.log("Column may already exist or error: " + e.message);
        }

        console.log("Creating bookings table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                booking_id int(11) NOT NULL AUTO_INCREMENT,
                tutee_id int(11) NOT NULL,
                tutor_id int(11) NOT NULL,
                booking_date datetime NOT NULL,
                notes text DEFAULT NULL,
                status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
                created_at timestamp DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (booking_id),
                FOREIGN KEY (tutee_id) REFERENCES tutees (tutee_id),
                FOREIGN KEY (tutor_id) REFERENCES tutors (tutor_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log("Bookings table created.");
        
        process.exit(0);
    } catch(err) {
        console.error("Error setting up DB:", err);
        process.exit(1);
    }
}

setupDB();
