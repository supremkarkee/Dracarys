const db = require('../services/db');

class Tutor {
    tutor_id;
    user_id;
    full_name;
    rating;
    description;
    subjects;
    lesson_count;
    points;

    constructor(tutor_id) {
        this.tutor_id = tutor_id;
    }

    async getTutorDetails() {
        if (typeof this.full_name !== 'string') {
            // Support both tutor_id and user_id queries
            let sql = '';
            let params = [];
            
            if (this.tutor_id && !this.tutor_id.startsWith('T') && !this.tutor_id.startsWith('S')) {
                // Numeric tutor_id
                sql = 'SELECT tutors.*, users.full_name, users.email, users.role FROM tutors JOIN users ON tutors.user_id = users.user_id WHERE tutors.tutor_id = ?';
                params = [this.tutor_id];
            } else {
                // User_id (starts with T, S, etc.)
                sql = 'SELECT tutors.*, users.full_name, users.email, users.role FROM tutors JOIN users ON tutors.user_id = users.user_id WHERE tutors.user_id = ?';
                params = [this.tutor_id];
            }
            
            const results = await db.query(sql, params);
            if (results.length > 0) {
<<<<<<< HEAD
                const row = results[0];
                this.user_id = row.user_id;
                this.full_name = row.full_name;
                this.name = row.full_name;
                this.rating = row.rating || 0.0;
                this.avgRating = row.rating || 0.0;
                this.description = row.description;
                this.qualification = row.qualification;
                this.qualifications = row.qualification ? [row.qualification] : [];
                this.subjects_str = row.subjects;
                this.subjects = row.subjects ? row.subjects.split(',').map(s => s.trim()) : [];
                this.lesson_count = row.lesson_count || 0;
                this.lessonsCount = row.lesson_count || 0;
                this.points = row.points || 0;
                this.verified = true; // Hardcoded for now, or add to DB later
                this.languages = ["English"]; // Default, can be expanded
=======
                this.tutor_id = results[0].tutor_id;
                this.user_id = results[0].user_id;
                this.full_name = results[0].full_name;
                this.email = results[0].email;
                this.rating = results[0].rating || 0;
                this.description = results[0].description || '';
                this.subjects = results[0].subjects || '';
                this.lesson_count = results[0].lesson_count || 0;
                this.points = results[0].points || 0;
>>>>>>> db4bc7b8295acbfb565967d21cb15f5eff450efc
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
        const sql = 'SELECT * FROM tutors JOIN users ON tutors.user_id = users.user_id ORDER BY points DESC LIMIT 1';
        const results = await db.query(sql);
        if (results.length > 0) {
            const t = new Tutor(results[0].tutor_id);
            Object.assign(t, results[0]);
            return t;
        }
        return null;
    }

    static async getAll() {
        const sql = 'SELECT * FROM tutors JOIN users ON tutors.user_id = users.user_id';
        const results = await db.query(sql);
        return results.map(row => {
            const t = new Tutor(row.tutor_id);
            Object.assign(t, row);
            return t;
        });
    }

    static async getBySubject(subjectId) {
        const sql = `
            SELECT tutors.*, users.full_name, users.email, users.role 
            FROM tutors 
            JOIN users ON tutors.user_id = users.user_id 
            JOIN tutor_subjects ON tutors.tutor_id = tutor_subjects.tutor_id 
            WHERE tutor_subjects.subject_id = ?
        `;
        const results = await db.query(sql, [subjectId]);
        return results.map(row => {
            const t = new Tutor(row.tutor_id);
            Object.assign(t, row);
            return t;
        });
    }

    static async search(query, subjectId = 'all') {
        let sql = `
            SELECT DISTINCT tutors.*, users.full_name, users.email, users.role 
            FROM tutors 
            JOIN users ON tutors.user_id = users.user_id 
            LEFT JOIN tutor_subjects ON tutors.tutor_id = tutor_subjects.tutor_id
            WHERE (users.full_name LIKE ? OR tutors.subjects LIKE ? OR tutors.description LIKE ?)
        `;
        const params = [`%${query}%`, `%${query}%`, `%${query}%` ];

        if (subjectId !== 'all') {
            sql += ` AND tutors.tutor_id IN (SELECT tutor_id FROM tutor_subjects WHERE subject_id = ?)`;
            params.push(subjectId);
        }

        const results = await db.query(sql, params);
        return results.map(row => {
            const t = new Tutor(row.tutor_id);
            Object.assign(t, row);
            return t;
        });
    }
}

module.exports = { Tutor };
