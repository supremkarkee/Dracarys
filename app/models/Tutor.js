/**
 * Tutor Model
 * 
 * This file contains all the database operations for tutors.
 * It handles loading a tutor's profile (including their subjects and reviews),
 * searching for tutors with filters, and updating profile information.
 */

const db = require('../services/db');   // This imports our database service so we can run SQL queries

class Tutor {

    tutor_id;
    user_id;
    full_name;
    rating;
    description;
    qualification;
    languages;
    lesson_count;
    points;
    verified;
    subjects = [];

    constructor(tutor_id) {
        this.tutor_id = tutor_id;
    }

    /**
     * Loads the full profile details for this tutor from the database.
     * This includes basic info from the 'tutors' table, the name from 'users',
     * and a list of subjects they teach.
     */
    async getTutorDetails() {
        // 1. Get basic tutor and user info
        const sql = `
            SELECT t.*, u.full_name, u.email 
            FROM tutors t 
            JOIN users u ON t.user_id = u.user_id 
            WHERE t.tutor_id = ?
        `;
        const results = await db.query(sql, [this.tutor_id]);

        if (results.length > 0) {
            const row = results[0];
            this.user_id = row.user_id;
            this.full_name = row.full_name;
            this.rating = row.rating;
            this.description = row.description;
            this.qualification = row.qualification;
            this.languages = row.languages;
            this.lesson_count = row.lesson_count;
            this.points = row.points;
            this.verified = row.verified;

            // 2. Get the subjects this tutor teaches
            const subjectSql = `
                SELECT s.subject_name 
                FROM tutor_subjects ts
                JOIN subjects s ON ts.subject_id = s.subject_id
                WHERE ts.tutor_id = ?
            `;
            const subjectResults = await db.query(subjectSql, [this.tutor_id]);
            this.subjects = subjectResults.map(s => s.subject_name);
        }
    }

    /**
     * Fetches all student reviews for this tutor.
     * Returns an array of reviews with the student's name.
     */
    async getReviews() {
        const sql = `
            SELECT r.*, u.full_name as tutee_name
            FROM reviews r
            JOIN tutees t ON r.tutee_id = t.tutee_id
            JOIN users u ON t.user_id = u.user_id
            WHERE r.tutor_id = ?
            ORDER BY r.review_date DESC
        `;
        return await db.query(sql, [this.tutor_id]);
    }

    /**
     * Calculates the average star rating based on all reviews.
     * Returns a number rounded to 1 decimal place (e.g. 4.5).
     */
    async calculateAvgRating() {
        const sql = 'SELECT AVG(rating) as avg_rating FROM reviews WHERE tutor_id = ?';
        const result = await db.query(sql, [this.tutor_id]);
        const avg = result[0].avg_rating || 0;
        return parseFloat(avg).toFixed(1);
    }

    /**
     * Updates a tutor's profile information.
     * Used from the tutor dashboard.
     */
    static async updateProfile(tutor_id, description, qualification, languages) {
        const sql = `
            UPDATE tutors 
            SET description = ?, qualification = ?, languages = ? 
            WHERE tutor_id = ?
        `;
        return await db.query(sql, [description, qualification, languages, tutor_id]);
    }

    /**
     * Main search function for the browse tutors page.
     * Supports filtering by keyword, subject, language, flags, and favorites.
     */
    static async search(query = '', subject = 'all', flaggedOnly = false, tuteeId = null, lang = 'all', favoritesOnly = false) {
        let sql = `
            SELECT DISTINCT t.*, u.full_name,
                   (SELECT GROUP_CONCAT(s.subject_name) 
                    FROM tutor_subjects ts 
                    JOIN subjects s ON ts.subject_id = s.subject_id 
                    WHERE ts.tutor_id = t.tutor_id) as subjects_list
            FROM tutors t
            JOIN users u ON t.user_id = u.user_id
            LEFT JOIN tutor_subjects ts ON t.tutor_id = ts.tutor_id
            LEFT JOIN subjects s ON ts.subject_id = s.subject_id
            WHERE 1=1
        `;
        
        const params = [];

        // 1. Filter by search keyword (name or description)
        if (query) {
            sql += ' AND (u.full_name LIKE ? OR t.description LIKE ?)';
            params.push(`%${query}%`, `%${query}%`);
        }

        // 2. Filter by subject
        if (subject && subject !== 'all') {
            sql += ' AND s.subject_name = ?';
            params.push(subject);
        }

        // 3. Filter by language
        if (lang && lang !== 'all') {
            sql += ' AND t.languages LIKE ?';
            params.push(`%${lang}%`);
        }

        // 4. Filter by flagged (reported) tutors
        if (flaggedOnly) {
            sql += ' AND t.tutor_id IN (SELECT tutor_id FROM flagged_tutors)';
        }

        // 5. Filter by favorites (only if student is logged in)
        if (favoritesOnly && tuteeId) {
            sql += ' AND t.tutor_id IN (SELECT tutor_id FROM favourites_tutors WHERE tutee_id = ?)';
            params.push(tuteeId);
        }

        const results = await db.query(sql, params);

        // Convert the subjects_list string back into an array for the frontend
        return results.map(row => ({
            ...row,
            subjects: row.subjects_list ? row.subjects_list.split(',') : []
        }));
    }
}

module.exports = { Tutor };
