const db = require('../services/db');  // database connection

class Subject {
    subject_id;
    subject_name;
    description;

    constructor(subject_id) {

        // store subject ID when object is created
        this.subject_id = subject_id;
    }

    /**
     * Load subject details from database
     * Only runs if data is not already loaded
     */
    async getSubjectDetails() {

        // check if subject name is already loaded
        if (typeof this.subject_name !== 'string') {
            const sql = 'SELECT * FROM subjects WHERE subject_id = ?';
            const results = await db.query(sql, [this.subject_id]);

            // if subject found, save details
            if (results.length > 0) {
                this.subject_name = results[0].subject_name;
                this.description = results[0].description;
            }
        }
    }

    /**
     * Get all subjects from database
     */
    static async getAll() {
        const sql = 'SELECT * FROM subjects';

        // to return full list of subject
        return await db.query(sql);
    }

    /**
     * Adds a subject to a tutor's teaching list.
     * If the subject doesn't exist in the global list, it creates it first.
     */
    static async addTutorSubject(tutorId, subjectName) {
        // 1. Find or create the subject in the global subjects table
        let subjectId;
        const subjects = await db.query('SELECT subject_id FROM subjects WHERE subject_name = ?', [subjectName]);
        
        if (subjects.length > 0) {
            subjectId = subjects[0].subject_id;
        } else {
            // Create the new subject category
            const result = await db.query('INSERT INTO subjects (subject_name) VALUES (?)', [subjectName]);
            subjectId = result.insertId;
        }
        
        // 2. Link the tutor to this subject (INSERT IGNORE prevents duplicates)
        const sql = 'INSERT IGNORE INTO tutor_subjects (tutor_id, subject_id) VALUES (?, ?)';
        return await db.query(sql, [tutorId, subjectId]);
    }

    /**
     * Removes a subject from a tutor's teaching list.
     */
    static async removeTutorSubject(tutorId, subjectName) {
        // Find the subject ID first
        const subjects = await db.query('SELECT subject_id FROM subjects WHERE subject_name = ?', [subjectName]);
        
        if (subjects.length > 0) {
            const subjectId = subjects[0].subject_id;
            const sql = 'DELETE FROM tutor_subjects WHERE tutor_id = ? AND subject_id = ?';
            return await db.query(sql, [tutorId, subjectId]);
        }
        
        return false;
    }
}

module.exports = { Subject };
