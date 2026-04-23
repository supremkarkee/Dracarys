const db = require('../services/db'); // what is this doing ?


// user story : as a tutee I want to book a lessoin with a tutor
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

    /**
     * Marks a booking as completed and increments the tutor's lesson count.
     */
    static async complete(bookingId) {
        // Get tutor_id for this booking
        const bookingSql = 'SELECT tutor_id FROM bookings WHERE booking_id = ?';
        const bookingResult = await db.query(bookingSql, [bookingId]);
        
        if (bookingResult.length > 0) {
            const tutorId = bookingResult[0].tutor_id;
            
            // Update booking status
            await db.query('UPDATE bookings SET status = "completed" WHERE booking_id = ?', [bookingId]);
            
            // Increment tutor lesson count
            await db.query('UPDATE tutors SET lesson_count = lesson_count + 1 WHERE tutor_id = ?', [tutorId]);
            
            return true;
        }
        return false;
    }
}

module.exports = { Booking };
