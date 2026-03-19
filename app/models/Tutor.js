const db = require('../services/db');

class Tutor {
    tutor_id;
    user_id;
    full_name;
    rating;
    description;
    qualification;
    subjects;
    lesson_count;
    points;

    constructor(tutor_id) {
        this.tutor_id = tutor_id;
    }

    async getTutorDetails() {
        if (typeof this.full_name !== 'string') {
            const sql = 'SELECT * FROM tutors JOIN users ON tutors.user_id = users.user_id WHERE tutors.tutor_id = ?';
            const results = await db.query(sql, [this.tutor_id]);
            if (results.length > 0) {
                this.user_id = results[0].user_id;
                this.full_name = results[0].full_name;
                this.rating = results[0].rating;
                this.description = results[0].description;
                this.qualification = results[0].qualification;
                this.subjects = results[0].subjects;
                this.lesson_count = results[0].lesson_count;
                this.points = results[0].points;
            }
        }
    }

    static async getTutorOfTheWeek() {
        const sql = 'SELECT * FROM tutors JOIN users ON tutors.user_id = users.user_id ORDER BY points DESC LIMIT 1';
        const results = await db.query(sql);
        return results[0];
    }

    static async getAll() {
        const sql = 'SELECT * FROM tutors JOIN users ON tutors.user_id = users.user_id';
        return await db.query(sql);
    }
}

module.exports = { Tutor };
