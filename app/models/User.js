const db = require('../services/db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

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
                this.email = results[0].email;
                this.role = results[0].role;
            }
        }
    }

    static async authenticate(email, password) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const results = await db.query(sql, [email]);
        if (results.length > 0) {
            const user = results[0];
            // For existing users with plain passwords, check plain
            if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
                const match = await bcrypt.compare(password, user.password_hash);
                if (match) {
                    return user;
                }
            } else {
                if (password === user.password_hash) {
                    return user;
                }
            }
        }
        return null;
    }

    static async register(fullName, email, password, role) {
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Generate unique user_id based on role
        let prefix = 'U'; // default
        let maxLimit = 999;
        
        if (role === 'tutor') {
            prefix = 'T';
            maxLimit = 999;
        } else if (role === 'tutee') {
            prefix = 'S';
            maxLimit = 999;
        } else if (role === 'admin') {
            prefix = 'A';
            maxLimit = 10; // Only 10 admin IDs allowed
        }
        
        // Find the max ID for this role
        const maxSql = 'SELECT MAX(CAST(SUBSTRING(user_id, 2) AS UNSIGNED)) as max_id FROM users WHERE user_id LIKE ?';
        const maxResult = await db.query(maxSql, [prefix + '%']);
        const maxId = maxResult[0].max_id || 0;
        const newId = maxId + 1;
        
        // Check if we've exceeded the limit (for admins)
        if (role === 'admin' && newId > maxLimit) {
            throw new Error('Admin ID limit reached. Maximum 10 admins allowed.');
        }
        
        const userId = prefix + newId.toString().padStart(3, '0');
        
        const sql = 'INSERT INTO users (user_id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)';
        await db.query(sql, [userId, fullName, email, passwordHash, role]);
        return userId;
    }

    static async getAll() {
        const sql = 'SELECT * FROM users';
        return await db.query(sql);
    }
}

module.exports = { User };
