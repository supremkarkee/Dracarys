const db = require('../services/db');

// bla bla bla
class Subject {
    subject_id;
    subject_name;
    description;

    constructor(subject_id) {
        this.subject_id = subject_id;
    }

    async getSubjectDetails() {
        if (typeof this.subject_name !== 'string') {
            const sql = 'SELECT * FROM subjects WHERE subject_id = ?';
            const results = await db.query(sql, [this.subject_id]);
            if (results.length > 0) {
                this.subject_name = results[0].subject_name;
                this.description = results[0].description;
            }
        }
    }

    static async getAll() {
        const sql = 'SELECT * FROM subjects';
        return await db.query(sql);
    }

    /**
     * Dynamically adds a subject (if it doesn't exist) and links it to a tutor.
     */
    static async addTutorSubject(tutorId, subjectName) {
        if (!subjectName || !subjectName.trim()) return;
        const name = subjectName.trim();
        
        // 1. Check if subject exists (case-insensitive)
        const subjectRows = await db.query('SELECT subject_id FROM subjects WHERE LOWER(subject_name) = LOWER(?)', [name]);
        let subjectId;
        
        if (subjectRows.length > 0) {
            subjectId = subjectRows[0].subject_id;
        } else {
            // 2. Insert new subject
            const insertResult = await db.query('INSERT INTO subjects (subject_name) VALUES (?)', [name]);
            subjectId = insertResult.insertId;
        }
        
        // 3. Link subject to tutor (if not already linked)
        const linkRows = await db.query('SELECT * FROM tutor_subjects WHERE tutor_id = ? AND subject_id = ?', [tutorId, subjectId]);
        if (linkRows.length === 0) {
            await db.query('INSERT INTO tutor_subjects (tutor_id, subject_id) VALUES (?, ?)', [tutorId, subjectId]);
        }
    }

    /**
     * Removes the link between a tutor and a subject.
     */
    static async removeTutorSubject(tutorId, subjectName) {
        if (!subjectName || !subjectName.trim()) return;
        const name = subjectName.trim();
        
        const subjectRows = await db.query('SELECT subject_id FROM subjects WHERE LOWER(subject_name) = LOWER(?)', [name]);
        if (subjectRows.length > 0) {
            const subjectId = subjectRows[0].subject_id;
            await db.query('DELETE FROM tutor_subjects WHERE tutor_id = ? AND subject_id = ?', [tutorId, subjectId]);
        }
    }
}

module.exports = { Subject };
