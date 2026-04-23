/**
 * Subject Model
 * 
 * This file contains all the database operations for subjects (the tutoring categories
 * like "Mathematics", "Science", etc.). It handles listing subjects, loading details,
 * and linking or removing subjects from a tutor's profile.
 */

const db = require('../services/db');   // This imports our database service so we can run SQL queries

class Subject {

    subject_id;
    subject_name;
    description;

    constructor(subject_id) {
        this.subject_id = subject_id;
    }

    /**
     * Loads the full details (name and description) for this subject from the database.
     * Only runs the query if we haven't already loaded the data.
     */
    async getSubjectDetails() {
        // Only fetch if we don't already have the name
        if (typeof this.subject_name !== 'string') {
            const sql = 'SELECT * FROM subjects WHERE subject_id = ?';
            const results = await db.query(sql, [this.subject_id]);

            if (results.length > 0) {
                this.subject_name = results[0].subject_name;
                this.description = results[0].description;
            }
        }
    }

    /**
     * Returns a list of ALL subjects available on the platform.
     */
    static async getAll() {
        const sql = 'SELECT * FROM subjects';
        return await db.query(sql);
    }

    /**
     * Adds a subject to a tutor’s profile.
     * If the subject doesn't exist yet, it creates it first (case-insensitive check).
     */
    static async addTutorSubject(tutorId, subjectName) {
        if (!subjectName || !subjectName.trim()) return;

        const name = subjectName.trim();

        // 1. Check if the subject already exists (case-insensitive)
        const subjectRows = await db.query(
            'SELECT subject_id FROM subjects WHERE LOWER(subject_name) = LOWER(?)', 
            [name]
        );

        let subjectId;

        if (subjectRows.length > 0) {
            subjectId = subjectRows[0].subject_id;
        } else {
            // 2. Create the new subject
            const insertResult = await db.query(
                'INSERT INTO subjects (subject_name) VALUES (?)', 
                [name]
            );
            subjectId = insertResult.insertId;
        }

        // 3. Link the subject to the tutor (only if not already linked)
        const linkRows = await db.query(
            'SELECT * FROM tutor_subjects WHERE tutor_id = ? AND subject_id = ?', 
            [tutorId, subjectId]
        );

        if (linkRows.length === 0) {
            await db.query(
                'INSERT INTO tutor_subjects (tutor_id, subject_id) VALUES (?, ?)', 
                [tutorId, subjectId]
            );
        }
    }

    /**
     * Removes the link between a tutor and a specific subject.
     * (The subject itself stays in the database for other tutors to use.)
     */
    static async removeTutorSubject(tutorId, subjectName) {
        if (!subjectName || !subjectName.trim()) return;

        const name = subjectName.trim();

        const subjectRows = await db.query(
            'SELECT subject_id FROM subjects WHERE LOWER(subject_name) = LOWER(?)', 
            [name]
        );

        if (subjectRows.length > 0) {
            const subjectId = subjectRows[0].subject_id;
            await db.query(
                'DELETE FROM tutor_subjects WHERE tutor_id = ? AND subject_id = ?', 
                [tutorId, subjectId]
            );
        }
    }
}

module.exports = { Subject };