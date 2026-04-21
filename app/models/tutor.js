const db = require('../services/db');

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

    async getTutorDetails() {
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
            if (results.length > 0) {
                const row = results[0];
                Object.assign(this, row);
                this.name = row.full_name;
                this.teaching_subjects = row.subjects_list || 'General Tutor';
                this.subjects = row.subjects_list ? row.subjects_list.split(',').map(s => s.trim()) : [];
                this.avgRating = row.rating || 0.0;
                this.lesson_count = row.lesson_count || 0;
                this.lessonsCount = row.lesson_count || 0;
                this.qualifications = row.qualification ? [row.qualification] : [];
                this.verified = true;
                this.languages = row.languages ? row.languages.split(',').map(s => s.trim()) : ['English'];
            }
        }
    }

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

        if (flaggedOnly && tuteeId) {
            sql += ' AND t.tutor_id IN (SELECT tutor_id FROM flagged_tutors WHERE tutee_id = ?)';
            params.push(tuteeId);
        }

        if (favoritesOnly && tuteeId) {
            sql += ' AND t.tutor_id IN (SELECT tutor_id FROM favourites_tutors WHERE tutee_id = ?)';
            params.push(tuteeId);
        }

        if (subjectFilter !== 'all') {
            sql += ' AND t.tutor_id IN (SELECT ts2.tutor_id FROM tutor_subjects ts2 JOIN subjects s2 ON ts2.subject_id = s2.subject_id WHERE s2.subject_name LIKE ?)';
            params.push(`%${subjectFilter}%`);
        }
        
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
}

module.exports = { Tutor };
