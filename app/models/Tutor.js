const db = require('../services/db'); // database connection

class Tutor {
    tutor_id;
    user_id;
    full_name;
    rating;
    description;
    teaching_subjects; // Full string for lists
    subjects;          // Array for profile/booking
    lesson_count;
    points;

    constructor(tutor_id) {
        this.tutor_id = tutor_id;
    }

    /**
     * Load tutor details from the database
     * Only runs if data is not already loaded
     */
    async getTutorDetails() {
        // check if details already exist
        if (typeof this.full_name !== 'string') {
            const sql = `
                SELECT t.*, u.full_name, u.email, u.role,
                       GROUP_CONCAT(DISTINCT s.subject_name SEPARATOR ', ') as subjects_list
                FROM tutors t
                JOIN users u ON t.user_id = u.user_id 
                LEFT JOIN tutor_subjects ts ON t.tutor_id = ts.tutor_id
                LEFT JOIN subjects s ON ts.subject_id = s.subject_id
                WHERE t.tutor_id = ? OR t.user_id = ?
                GROUP BY t.tutor_id, u.user_id, u.full_name, u.email, u.role
            `;
            const results = await db.query(sql, [this.tutor_id, this.tutor_id]);

            // if tutor found, save data into object
            if (results.length > 0) {
                const row = results[0];
                Object.assign(this, row); // copy all fields

                this.name = row.full_name;

                // subjects as string and array
                this.teaching_subjects = row.subjects_list || 'General Tutor';
                this.subjects = row.subjects_list ? row.subjects_list.split(',').map(s => s.trim()) : [];
                // ratings and lessons count
                this.avgRating = row.rating || 0.0;
                this.lesson_count = row.lesson_count || 0;
                this.lessonsCount = row.lesson_count || 0;
                // extra info
                this.qualifications = row.qualification ? [row.qualification] : [];
                this.verified = row.verified === 1 || row.verified === true;
                // languages as array
                this.languages = row.languages ? row.languages.split(',').map(s => s.trim()) : ['English'];
            }
        }
    }

    /**
     * to get all reviews for this tutor
     */
    async getReviews() {
        const sql = `
            SELECT r.*, u.full_name AS studentName 
            FROM reviews r
            JOIN tutees t ON r.tutee_id = t.tutee_id
            JOIN users u ON t.user_id = u.user_id
            WHERE r.tutor_id = ?
            ORDER BY r.review_date DESC
        `;
        this.reviews = await db.query(sql, [this.tutor_id]);
        this.reviewCount = this.reviews.length;
        return this.reviews;
    }

    /**
     * Calculates the average rating from the reviews table and updates the tutor record.
     */
    async calculateAvgRating() {
        const sql = 'SELECT AVG(rating) as avgRating FROM reviews WHERE tutor_id = ?';
        const results = await db.query(sql, [this.tutor_id]);
        const avg = results[0].avgRating || 0.0;

        // Update the tutors table with the new average
        await db.query('UPDATE tutors SET rating = ? WHERE tutor_id = ?', [avg, this.tutor_id]);

        this.avgRating = parseFloat(avg).toFixed(1);
        return this.avgRating;
    }

    /**
     * Recalculates the tutor's points based on lessons, reviews, and rating.
     */
    async calculatePoints() {
        // Optimized: Get all counts in one database trip
        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM bookings WHERE tutor_id = ? AND (status = "accepted" OR status = "completed")) as lessonCount,
                (SELECT COUNT(*) FROM reviews WHERE tutor_id = ?) as reviewCount,
                (SELECT rating FROM tutors WHERE tutor_id = ?) as currentRating
        `;
        
        const results = await db.query(sql, [this.tutor_id, this.tutor_id, this.tutor_id]);
        const row = results[0];
        
        const lessonCount = row.lessonCount || 0;
        const reviewCount = row.reviewCount || 0;
        const rating = row.currentRating || 0.0;

        // Formula: (Lessons * 10) + (Reviews * 5) + (Rating * 20)
        const newPoints = Math.round((lessonCount * 10) + (reviewCount * 5) + (rating * 20));

        // Update the database with new stats
        await db.query('UPDATE tutors SET points = ?, lesson_count = ? WHERE tutor_id = ?', 
            [newPoints, lessonCount, this.tutor_id]);

        this.points = newPoints;
        this.lesson_count = lessonCount;
        return newPoints;
    }

    /**
     * to get the tutor with highest points
     */
    static async getTutorOfTheWeek() {
        const sql = `
            SELECT t.*, u.full_name, u.email,
                   GROUP_CONCAT(DISTINCT s.subject_name SEPARATOR ', ') AS subjects_list
            FROM tutors t
            JOIN users u ON t.user_id = u.user_id 
            LEFT JOIN tutor_subjects ts ON t.tutor_id = ts.tutor_id
            LEFT JOIN subjects s ON ts.subject_id = s.subject_id
            GROUP BY t.tutor_id, u.user_id, u.full_name, u.email
            ORDER BY t.points DESC LIMIT 1
        `;
        const results = await db.query(sql);
        if (results.length > 0) {
            const row = results[0];
            const t = new Tutor(row.tutor_id);
            Object.assign(t, row);
            t.teaching_subjects = row.subjects_list || 'General Tutor';
            t.subjects = row.subjects_list ? row.subjects_list.split(',').map(s => s.trim()) : [];
            return t;
        }
        return null;
    }

    /**
     * to get all tutors
     */
    static async getAll() {
        const sql = `
            SELECT t.*, u.full_name, u.email,
                   GROUP_CONCAT(DISTINCT s.subject_name SEPARATOR ', ') AS subjects_list
            FROM tutors t
            JOIN users u ON t.user_id = u.user_id 
            LEFT JOIN tutor_subjects ts ON t.tutor_id = ts.tutor_id
            LEFT JOIN subjects s ON ts.subject_id = s.subject_id
            GROUP BY t.tutor_id, u.user_id, u.full_name, u.email
        `;
        const results = await db.query(sql);
        return results.map(row => {
            const t = new Tutor(row.tutor_id);
            Object.assign(t, row);
            t.teaching_subjects = row.subjects_list || 'General Tutor';
            t.subjects = row.subjects_list ? row.subjects_list.split(',').map(s => s.trim()) : [];
            return t;
        });
    }

    /**
     * Search tutors with filters (name, subject, language, etc.)
     */
    static async search(query, subjectFilter = 'all', flaggedOnly = false, tuteeId = null, languageFilter = 'all', favoritesOnly = false) {
        let sql = `
            SELECT t.*, u.full_name, u.email,
                   GROUP_CONCAT(DISTINCT s.subject_name SEPARATOR ', ') AS subjects_list
            FROM tutors t
            JOIN users u ON t.user_id = u.user_id 
            LEFT JOIN tutor_subjects ts ON t.tutor_id = ts.tutor_id
            LEFT JOIN subjects s ON ts.subject_id = s.subject_id
            WHERE 1=1
        `;

        let params = [];

        // filter flagged tutors
        if (flaggedOnly && tuteeId) {
            sql += ' AND t.tutor_id IN (SELECT tutor_id FROM flagged_tutors WHERE tutee_id = ?)';
            params.push(tuteeId);
        }

        // filter favorite tutors
        if (favoritesOnly && tuteeId) {
            sql += ' AND t.tutor_id IN (SELECT tutor_id FROM favourites_tutors WHERE tutee_id = ?)';
            params.push(tuteeId);
        }

        // filter by subject
        if (subjectFilter !== 'all') {
            sql += ' AND t.tutor_id IN (SELECT ts2.tutor_id FROM tutor_subjects ts2 JOIN subjects s2 ON ts2.subject_id = s2.subject_id WHERE s2.subject_name LIKE ?)';
            params.push(`%${subjectFilter}%`);
        }

        // filter by language
        if (languageFilter !== 'all') {
            sql += ' AND t.languages LIKE ?';
            params.push(`%${languageFilter}%`);
        }

        sql += ' GROUP BY t.tutor_id, u.user_id, u.full_name, u.email';

        if (query) {
            sql += ' HAVING (full_name LIKE ? OR subjects_list LIKE ? OR description LIKE ? OR qualification LIKE ?)';
            const q = `%${query}%`;
            params.push(q, q, q, q);
        }

        const results = await db.query(sql, params);
        return results.map(row => {
            const t = new Tutor(row.tutor_id);
            Object.assign(t, row);
            t.teaching_subjects = row.subjects_list || 'General Tutor';
            t.subjects = row.subjects_list ? row.subjects_list.split(',').map(s => s.trim()) : [];
            return t;
        });
    }

    /**
    * Update tutor profile details
    */
    static async updateProfile(tutor_id, description, qualification, languages) {
        const sql = `
            UPDATE tutors 
            SET description = ?, qualification = ?, languages = ? 
            WHERE tutor_id = ?
        `;
        return await db.query(sql, [description, qualification, languages, tutor_id]);
    }
}

module.exports = { Tutor };
