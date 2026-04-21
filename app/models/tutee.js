const db = require('../services/db');

class Tutee {
    tutee_id;
    user_id;
    full_name;
    school_level;
    grade_level;

    constructor(tutee_id) {
        this.tutee_id = tutee_id;
    }

    async getTuteeDetails() {
        if (typeof this.full_name !== 'string') {
            const sql = 'SELECT t.*, u.full_name FROM tutees t JOIN users u ON t.user_id = u.user_id WHERE t.tutee_id = ?';
            const results = await db.query(sql, [this.tutee_id]);
            if (results.length > 0) {
                this.user_id = results[0].user_id;
                this.full_name = results[0].full_name;
                this.school_level = results[0].school_level;
                this.grade_level = results[0].grade_level;
            }
        }
    }

    static async getByTutor(tutorId) {
        const sql = `
            SELECT DISTINCT t.tutee_id, u.full_name, u.email, t.school_level, t.grade_level
            FROM tutees t
            JOIN users u ON t.user_id = u.user_id
            JOIN bookings b ON t.tutee_id = b.tutee_id
            WHERE b.tutor_id = ?
        `;
        return await db.query(sql, [tutorId]);
    }

    static async getAll() {
        const sql = 'SELECT t.tutee_id, u.full_name FROM tutees t JOIN users u ON t.user_id = u.user_id';
        return await db.query(sql);
    }
}

module.exports = { Tutee };
