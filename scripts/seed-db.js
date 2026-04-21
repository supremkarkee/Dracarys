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
    { userId: 'A001', fullName: 'Super Admin',     email: 'admin@dracarys.com',        password: 'AdminPassword123!', role: 'admin' },
    { userId: 'U001', fullName: 'Alice Johnson',   email: 'alice.johnson@email.com',   password: 'Alice@123',     role: 'tutor' },
    { userId: 'U002', fullName: 'Brian Smith',     email: 'brian.smith@email.com',     password: 'Brian@123',     role: 'tutor' },
    { userId: 'U003', fullName: 'Catherine Lee',   email: 'catherine.lee@email.com',   password: 'Catherine@123', role: 'tutee' },
    { userId: 'U004', fullName: 'Daniel Brown',    email: 'daniel.brown@email.com',    password: 'Daniel@123',    role: 'tutee' },
    { userId: 'U005', fullName: 'Emily Davis',     email: 'emily.davis@email.com',     password: 'Emily@123',     role: 'tutor' },
    { userId: 'U006', fullName: 'Frank Wilson',    email: 'frank.wilson@email.com',    password: 'Frank@123',     role: 'tutee' },
    { userId: 'U007', fullName: 'George Martin',   email: 'george.martin@email.com',   password: 'George@123',    role: 'tutor' },
    { userId: 'U008', fullName: 'Hannah Clark',    email: 'hannah.clark@email.com',    password: 'Hannah@123',    role: 'tutor' },
    { userId: 'U009', fullName: 'Ian Wright',      email: 'ian.wright@email.com',      password: 'Ian@123',       role: 'tutor' },
    { userId: 'U010', fullName: 'Jack Miller',     email: 'jack.miller@email.com',     password: 'Jack@123',      role: 'tutor' },
    { userId: 'U011', fullName: 'Karen White',    email: 'karen.white@email.com',     password: 'Karen@123',     role: 'tutor' },
    { userId: 'U012', fullName: 'Liam Scott',      email: 'liam.scott@email.com',      password: 'Liam@123',      role: 'tutor' }
];

const seedTutors = [
    { userId: 'U001', rating: 4.8, points: 120, lessonCount: 120, description: 'Experienced mathematics tutor specialising in algebra and calculus.', qualification: 'MSc Mathematics – University of London', languages: 'English, French' },
    { userId: 'U002', rating: 4.5, points: 85,  lessonCount: 85,  description: 'Chemistry tutor helping students through practical examples.',       qualification: 'BSc Chemistry – University of Manchester', languages: 'English, German' },
    { userId: 'U005', rating: 4.9, points: 150, lessonCount: 150, description: 'Software engineer and programming tutor.',                           qualification: 'BSc Computer Science – MIT', languages: 'English, Spanish' },
    { userId: 'U007', rating: 4.7, points: 110, lessonCount: 95,  description: 'Passionate History and Geography teacher blending facts with incredible stories.', qualification: 'BA History - Cambridge', languages: 'English' },
    { userId: 'U008', rating: 4.6, points: 90,  lessonCount: 75,  description: 'Creative teacher specializing in English literature and Music theory.', qualification: 'MA Literature - Oxford', languages: 'English, Italian' },
    { userId: 'U009', rating: 5.0, points: 200, lessonCount: 210, description: 'Polymath tutor who completely covers Mathematics, Physics, Chemistry, and Computer Science!', qualification: 'PhD Physics - Imperial College', languages: 'English, French, Mandarin' },
    { userId: 'U010', rating: 4.7, points: 60,  lessonCount: 45,  description: 'Focused Biology specialist teaching advanced human anatomy.', qualification: 'MD – King\'s College London', languages: 'English, German' },
    { userId: 'U011', rating: 4.8, points: 75,  lessonCount: 55,  description: 'Expert Economics tutor for a-level and undergraduate students.', qualification: 'MA Economics – LSE', languages: 'English' },
    { userId: 'U012', rating: 4.6, points: 40,  lessonCount: 30,  description: 'Software developer teaching exclusively Python and Logic.', qualification: 'BSc Software Engineering – Sheffield', languages: 'English, Spanish' }
];

const tutorSubjectsMap = [
    { userId: 'U001', subjectIds: [1, 2] },             
    { userId: 'U002', subjectIds: [3, 4] },             
    { userId: 'U005', subjectIds: [5] },                
    { userId: 'U007', subjectIds: [6, 7] },             
    { userId: 'U008', subjectIds: [4, 8] },             
    { userId: 'U009', subjectIds: [1, 2, 3, 5] },
    { userId: 'U010', subjectIds: [10] },                
    { userId: 'U011', subjectIds: [9] },                
    { userId: 'U012', subjectIds: [5] }
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
            `INSERT INTO users (user_id, full_name, email, password_hash, role)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                full_name = VALUES(full_name),
                email = VALUES(email),
                password_hash = VALUES(password_hash),
                role = VALUES(role)`,
            [u.userId, u.fullName, u.email, hash, u.role]
        );
        console.log(`  ✅  Upserted user: ${u.email} (${u.role})`);
    }

    for (const t of seedTutors) {
        await db.query(
            `INSERT INTO tutors (user_id, rating, points, lesson_count, description, qualification, languages)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                rating = VALUES(rating),
                points = VALUES(points),
                lesson_count = VALUES(lesson_count),
                description = VALUES(description),
                qualification = VALUES(qualification),
                languages = VALUES(languages)`,
            [t.userId, t.rating, t.points, t.lessonCount, t.description, t.qualification, t.languages]
        );
        console.log(`  ✅  Upserted tutor record for user: ${t.userId}`);
    }

    // Insert Tutor <-> Subject relations
    for (const entry of tutorSubjectsMap) {
        // Find tutor primary key
        const tResult = await db.query('SELECT tutor_id FROM tutors WHERE user_id = ?', [entry.userId]);
        if (tResult.length > 0) {
            const tutorPK = tResult[0].tutor_id;
            for (const subj of entry.subjectIds) {
                // Ignore if it already exists
                await db.query(
                    'INSERT IGNORE INTO tutor_subjects (tutor_id, subject_id) VALUES (?, ?)',
                    [tutorPK, subj]
                );
            }
        }
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
