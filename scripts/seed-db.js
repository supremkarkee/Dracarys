/**
 * Seed Script – Dracarys
 * ──────────────────────
 * Run this ONCE after `docker compose up` to insert seed users with
 * properly bcrypt-hashed passwords.
 *
 * Usage:
 *   node scripts/seed-db.js
 *
 * It is safe to run multiple times – it uses INSERT IGNORE so it
 * won't duplicate rows.
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../app/services/db');

const SALT_ROUNDS = 10;

const seedUsers = [
    { userId: 'U001', fullName: 'Alice Johnson',   email: 'alice.johnson@email.com',   password: 'Alice@123',     role: 'tutor' },
    { userId: 'U002', fullName: 'Brian Smith',     email: 'brian.smith@email.com',     password: 'Brian@123',     role: 'tutor' },
    { userId: 'U003', fullName: 'Catherine Lee',   email: 'catherine.lee@email.com',   password: 'Catherine@123', role: 'tutee' },
    { userId: 'U004', fullName: 'Daniel Brown',    email: 'daniel.brown@email.com',    password: 'Daniel@123',    role: 'tutee' },
    { userId: 'U005', fullName: 'Emily Davis',     email: 'emily.davis@email.com',     password: 'Emily@123',     role: 'tutor' },
    { userId: 'U006', fullName: 'Frank Wilson',    email: 'frank.wilson@email.com',    password: 'Frank@123',     role: 'tutee' },
];

const seedTutors = [
    { userId: 'U001', rating: 4.8, points: 120, lessonCount: 120, description: 'Experienced mathematics tutor specialising in algebra and calculus.', qualification: 'MSc Mathematics – University of London',       subjects: 'Mathematics, Physics' },
    { userId: 'U002', rating: 4.5, points: 85,  lessonCount: 85,  description: 'Chemistry tutor helping students through practical examples.',       qualification: 'BSc Chemistry – University of Manchester',     subjects: 'Chemistry, Biology' },
    { userId: 'U005', rating: 4.9, points: 150, lessonCount: 150, description: 'Software engineer and programming tutor.',                           qualification: 'BSc Computer Science – MIT',                   subjects: 'Computer Science, Programming' },
];

const seedTutees = [
    { userId: 'U003', schoolLevel: 'High School',   gradeLevel: 'Grade 10' },
    { userId: 'U004', schoolLevel: 'High School',   gradeLevel: 'Grade 12' },
    { userId: 'U006', schoolLevel: 'Middle School', gradeLevel: 'Grade 8'  },
];

async function run() {
    console.log('🌱  Starting seed...\n');

    for (const u of seedUsers) {
        const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
        await db.query(
            `INSERT IGNORE INTO users (user_id, full_name, email, password_hash, role)
             VALUES (?, ?, ?, ?, ?)`,
            [u.userId, u.fullName, u.email, hash, u.role]
        );
        console.log(`  ✅  Upserted user: ${u.email} (${u.role})`);
    }

    for (const t of seedTutors) {
        await db.query(
            `INSERT IGNORE INTO tutors (user_id, rating, points, lesson_count, description, qualification, subjects)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [t.userId, t.rating, t.points, t.lessonCount, t.description, t.qualification, t.subjects]
        );
        console.log(`  ✅  Upserted tutor record for user: ${t.userId}`);
    }

    for (const s of seedTutees) {
        await db.query(
            `INSERT IGNORE INTO tutees (user_id, school_level, grade_level)
             VALUES (?, ?, ?)`,
            [s.userId, s.schoolLevel, s.gradeLevel]
        );
        console.log(`  ✅  Upserted tutee record for user: ${s.userId}`);
    }

    console.log('\n🎉  Seed complete! You can now log in with any seed user.');
    console.log('    Example: alice.johnson@email.com / Alice@123\n');
    process.exit(0);
}

run().catch(err => {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
});
