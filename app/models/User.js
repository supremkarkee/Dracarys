/**
 * User Model
 * 
 * This file handles all user-related database operations:
 * - Registering new users (with secure password hashing)
 * - Authenticating users on login
 * - Loading user details
 * - Creating the matching tutor or tutee profile automatically
 */

const db = require('../services/db');      // This imports our database service so we can run SQL queries
const bcrypt = require('bcrypt');          // Used to securely hash passwords (never store plain text)
const SALT_ROUNDS = 10;                    // Number of hashing rounds – higher is more secure but slower

class User {

    user_id;
    full_name;
    email;
    role;

    constructor(user_id) {
        this.user_id = user_id;
    }

    /**
     * Loads the full user details (name, email, role) from the database.
     * Only runs the query if we haven't already loaded the data.
     */
    async getUserDetails() {
        // Only fetch if we don't already have the name
        if (typeof this.full_name !== 'string') {
            const sql = 'SELECT * FROM users WHERE user_id = ?';
            const results = await db.query(sql, [this.user_id]);

            if (results.length > 0) {
                this.full_name = results[0].full_name;
                this.email     = results[0].email;
                this.role      = results[0].role;
            }
        }
    }

    /**
     * Checks if the email and password are correct.
     * Supports both modern hashed passwords and old plain-text ones (for development).
     */
    static async authenticate(email, password) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const results = await db.query(sql, [email]);

        if (results.length > 0) {
            const user = results[0];

            // Modern hashed password (starts with $2b$ or $2a$)
            if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
                const match = await bcrypt.compare(password, user.password_hash);
                if (match) return user;
            } 
            // Legacy plain-text support (only for development)
            else {
                if (password === user.password_hash) return user;
            }
        }

        return null;
    }

    /**
     * Creates a new user account and automatically makes the matching
     * tutor or tutee profile row. Uses a custom ID format (T001, S001, etc.).
     */
    static async register(fullName, email, password, role) {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Generate custom user_id with role prefix (T001, S001, A001, etc.)
        let prefix = 'U';
        if (role === 'tutor') prefix = 'T';
        else if (role === 'tutee') prefix = 'S';
        else if (role === 'admin') prefix = 'A';

        const maxSql = 'SELECT MAX(CAST(SUBSTRING(user_id, 2) AS UNSIGNED)) as max_id FROM users WHERE user_id LIKE ?';
        const maxResult = await db.query(maxSql, [prefix + '%']);
        const maxId = maxResult[0].max_id || 0;
        const newId = maxId + 1;
        const userId = prefix + newId.toString().padStart(3, '0');

        // Create the main user record
        await db.query(
            'INSERT INTO users (user_id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [userId, fullName, email, passwordHash, role]
        );

        // Create the matching profile in the role-specific table
        if (role === 'tutor') {
            await db.query(
                'INSERT INTO tutors (user_id, rating, lesson_count, points) VALUES (?, 0.0, 0, 0)',
                [userId]
            );
        } else if (role === 'tutee') {
            await db.query(
                'INSERT INTO tutees (user_id) VALUES (?)',
                [userId]
            );
        }

        return userId;
    }

    /**
     * Returns a list of ALL users in the system.
     * Mainly used by admins.
     */
    static async getAll() {
        const sql = 'SELECT * FROM users';
        return await db.query(sql);
    }
}

module.exports = { User };