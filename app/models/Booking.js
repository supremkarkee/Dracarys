const db = require('../services/db');

class Booking {
    static async getByTutee(tuteeId) {
        const sql = `
            SELECT b.*, u.full_name as tutor_name
            FROM bookings b
            JOIN tutors t ON b.tutor_id = t.tutor_id
            JOIN users u ON t.user_id = u.user_id
            WHERE b.tutee_id = ?
            ORDER BY b.lesson_date DESC, b.lesson_time DESC
        `;
        return await db.query(sql, [tuteeId]);
    }

    static async getByTutor(tutorId) {
        const sql = `
            SELECT b.*, u.full_name as student_name
            FROM bookings b
            JOIN tutees t ON b.tutee_id = t.tutee_id
            JOIN users u ON t.user_id = u.user_id
            WHERE b.tutor_id = ?
            ORDER BY b.lesson_date DESC, b.lesson_time DESC
        `;
        return await db.query(sql, [tutorId]);
    }

    static async checkExisting(tuteeId, tutorId) {
        if (!tuteeId || !tutorId) return null;
        const sql = 'SELECT * FROM bookings WHERE tutee_id = ? AND tutor_id = ? AND status = "pending"';
        const results = await db.query(sql, [tuteeId, tutorId]);
        return results.length > 0 ? results[0] : null;
    }

    static async create(tuteeId, tutorId, lessonDate, lessonTime, endTime, subjectName) {
        const sql = 'INSERT INTO bookings (tutee_id, tutor_id, lesson_date, lesson_time, end_time, subject_name, status) VALUES (?, ?, ?, ?, ?, ?, "pending")';
        const result = await db.query(sql, [tuteeId, tutorId, lessonDate, lessonTime, endTime, subjectName]);
        return result.insertId;
    }

    static async updateStatus(bookingId, status, message = null) {
        const sql = 'UPDATE bookings SET status = ?, tutor_message = ? WHERE booking_id = ?';
        return await db.query(sql, [status, message, bookingId]);
    }

    static async cancel(bookingId, tuteeId) {
        const sql = 'DELETE FROM bookings WHERE booking_id = ? AND tutee_id = ?';
        return await db.query(sql, [bookingId, tuteeId]);
    }
}

module.exports = { Booking };
