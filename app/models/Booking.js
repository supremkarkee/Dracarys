/**
 * Booking Model
 * 
 * This file contains all the database operations for bookings (lesson requests between students and tutors).
 * It handles fetching a user's bookings, checking for existing bookings, creating new ones,
 * updating status, canceling, and marking lessons as completed.
 */

const db = require('../services/db');   // This imports our database service so we can run SQL queries

class Booking {

    /**
     * Gets all bookings for a specific student (tutee).
     * Shows the tutor's name along with booking details.
     */
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

    /**
     * Gets all bookings for a specific tutor.
     * Shows the student's name along with booking details.
     */
    static async getByTutor(tutorId) {
        const sql = `
            SELECT b.*, u.full_name as student_name, u.email as student_email, t.grade_level, t.school_level
            FROM bookings b
            JOIN tutees t ON b.tutee_id = t.tutee_id
            JOIN users u ON t.user_id = u.user_id
            WHERE b.tutor_id = ?
            ORDER BY b.lesson_date DESC, b.lesson_time DESC
        `;
        return await db.query(sql, [tutorId]);
    }

    /**
     * Checks if a student already has a pending booking with this tutor.
     * Prevents double-booking the same tutor.
     */
    static async checkExisting(tuteeId, tutorId) {
        if (!tuteeId || !tutorId) return null;

        const sql = 'SELECT * FROM bookings WHERE tutee_id = ? AND tutor_id = ? AND status = "pending"';
        const results = await db.query(sql, [tuteeId, tutorId]);

        return results.length > 0 ? results[0] : null;
    }

    /**
     * Creates a new booking (lesson request) from a student to a tutor.
     * Starts with "pending" status until the tutor accepts or declines.
     */
    static async create(tuteeId, tutorId, lessonDate, lessonTime, endTime, subjectName) {
        const sql = `
            INSERT INTO bookings 
            (tutee_id, tutor_id, lesson_date, lesson_time, end_time, subject_name, status) 
            VALUES (?, ?, ?, ?, ?, ?, "pending")
        `;

        const result = await db.query(sql, [tuteeId, tutorId, lessonDate, lessonTime, endTime, subjectName]);
        return result.insertId;
    }

    /**
     * Updates the status of a booking (e.g. accepted, declined, completed).
     * Tutors use this from their dashboard.
     */
    static async updateStatus(bookingId, status, message = null) {
        const sql = 'UPDATE bookings SET status = ?, tutor_message = ? WHERE booking_id = ?';
        return await db.query(sql, [status, message, bookingId]);
    }

    /**
     * Cancels a booking (only the student who made it can do this).
     */
    static async cancel(bookingId, tuteeId) {
        const sql = 'DELETE FROM bookings WHERE booking_id = ? AND tutee_id = ?';
        return await db.query(sql, [bookingId, tuteeId]);
    }

    /**
     * Marks a booking as completed and increases the tutor's total lesson count.
     * Used by tutors when they finish a lesson.
     */
    static async complete(bookingId) {
        // First, find out which tutor this booking belongs to
        const bookingSql = 'SELECT tutor_id FROM bookings WHERE booking_id = ?';
        const bookingResult = await db.query(bookingSql, [bookingId]);

        if (bookingResult.length > 0) {
            const tutorId = bookingResult[0].tutor_id;

            // Mark the booking as completed
            await db.query('UPDATE bookings SET status = "completed" WHERE booking_id = ?', [bookingId]);

            // Give the tutor credit for one more lesson
            await db.query('UPDATE tutors SET lesson_count = lesson_count + 1 WHERE tutor_id = ?', [tutorId]);

            return true;
        }

        return false;
    }
}

module.exports = { Booking };