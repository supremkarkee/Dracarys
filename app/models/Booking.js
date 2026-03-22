const db = require('../services/db');

class Booking {
    constructor(booking_id) {
        this.booking_id = booking_id;
    }

    static async create(tutee_id, tutor_id) {
        const sql = 'INSERT INTO bookings (tutee_id, tutor_id) VALUES (?, ?)';
        const results = await db.query(sql, [tutee_id, tutor_id]);
        return results.insertId;
    }

    static async getByTutor(tutor_id) {
        const sql = `
            SELECT b.*, u.full_name AS student_name 
            FROM bookings b
            JOIN tutees t ON b.tutee_id = t.tutee_id
            JOIN users u ON t.user_id = u.user_id
            WHERE b.tutor_id = ?
            ORDER BY b.created_at DESC
        `;
        return await db.query(sql, [tutor_id]);
    }

    static async getByTutee(tutee_id) {
        const sql = `
            SELECT b.*, u.full_name AS tutor_name 
            FROM bookings b
            JOIN tutors t ON b.tutor_id = t.tutor_id
            JOIN users u ON t.user_id = u.user_id
            WHERE b.tutee_id = ?
            ORDER BY b.created_at DESC
        `;
        return await db.query(sql, [tutee_id]);
    }

    static async checkExisting(tutee_id, tutor_id) {
        const sql = 'SELECT * FROM bookings WHERE tutee_id = ? AND tutor_id = ? AND status != "declined"';
        const results = await db.query(sql, [tutee_id, tutor_id]);
        return results.length > 0 ? results[0] : null;
    }

    static async updateStatus(booking_id, status) {
        const sql = 'UPDATE bookings SET status = ? WHERE booking_id = ?';
        return await db.query(sql, [status, booking_id]);
    }
}

module.exports = { Booking };
