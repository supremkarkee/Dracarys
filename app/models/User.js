const db = require('../services/db');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

class User {
    user_id;
    full_name;
    email;
    role;

    constructor(user_id) {
        this.user_id = user_id;
    }

    async getUserDetails() {
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

    static async authenticate(email, password) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const results = await db.query(sql, [email]);
        if (results.length > 0) {
            const user = results[0];
            // Support both hashed and legacy plain-text passwords for dev
            if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
                const match = await bcrypt.compare(password, user.password_hash);
                if (match) return user;
            } else {
                if (password === user.password_hash) return user;
            }
        }
        return null;
    }

    /**
     * Registers a new user and creates the matching tutor/tutee profile row.
     */
    static async register(fullName, email, password, role) {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // Generate role-prefixed ID (T001, S001, etc.)
        let prefix = 'U';
        if (role === 'tutor') prefix = 'T';
        else if (role === 'tutee') prefix = 'S';
        else if (role === 'admin') prefix = 'A';
        
        const maxSql = 'SELECT MAX(CAST(SUBSTRING(user_id, 2) AS UNSIGNED)) as max_id FROM users WHERE user_id LIKE ?';
        const maxResult = await db.query(maxSql, [prefix + '%']);
        const maxId = maxResult[0].max_id || 0;
        const newId = maxId + 1;
        const userId = prefix + newId.toString().padStart(3, '0');
        
        // Insert into users
        await db.query(
            'INSERT INTO users (user_id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [userId, fullName, email, passwordHash, role]
        );
        
        // Create matching record in role-specific table
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

    static async getAll() {
        const sql = 'SELECT * FROM users';
        return await db.query(sql);
    }
}

module.exports = { User };
