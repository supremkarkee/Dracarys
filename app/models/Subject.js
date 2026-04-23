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
}

module.exports = { Subject };
