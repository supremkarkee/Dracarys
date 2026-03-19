const db = require('../services/db');

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
}

module.exports = { Subject };
