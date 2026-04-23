/**
 * Tutee Model
 * 
 * This file contains all the database operations for students (tutees).
 * It handles loading a student's profile, listing students, and updating
 * their education details (school level and grade level).
 */

const db = require('../services/db');   // This imports our database service so we can run SQL queries

class Tutee {

    tutee_id;
    user_id;
    full_name;
    school_level;
    grade_level;

    constructor(tutee_id) {
        this.tutee_id = tutee_id;
    }

    /**
     * Loads the full profile details for this student from the database.
     * Only runs the query if we haven't already loaded the data.
     */
    async getTuteeDetails() {
        // Only fetch if we don't already have the name
        if (typeof this.full_name !== 'string') {
            const sql = `
                SELECT t.*, u.full_name 
                FROM tutees t 
                JOIN users u ON t.user_id = u.user_id 
                WHERE t.tutee_id = ?
            `;

            const results = await db.query(sql, [this.tutee_id]);

            if (results.length > 0) {
                this.user_id = results[0].user_id;
                this.full_name = results[0].full_name;
                this.school_level = results[0].school_level;
                this.grade_level = results[0].grade_level;
            }
        }
    }

    /**
     * Returns a list of all students who have booked a lesson with a specific tutor.
     * Used on the tutor dashboard to show their students.
     */
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

    /**
     * Returns a simple list of ALL students on the platform.
     * Used on the "Our Students" page.
     */
    static async getAll() {
        const sql = `
            SELECT t.tutee_id, u.full_name 
            FROM tutees t 
            JOIN users u ON t.user_id = u.user_id
        `;
        return await db.query(sql);
    }

    /**
     * Updates a student's school level and grade level.
     * Used from the student dashboard when they edit their education info.
     */
    static async updateEducation(tutee_id, school_level, grade_level) {
        const sql = 'UPDATE tutees SET school_level = ?, grade_level = ? WHERE tutee_id = ?';
        return await db.query(sql, [school_level, grade_level, tutee_id]);
    }
}

module.exports = { Tutee };