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
            const match = await bcrypt.compare(password, user.password_hash);
            if (match) {
                return user;
            }
        }
        return null;
    }

    static async register(fullName, email, password, role) {
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const userId = 'U' + Math.floor(Math.random() * 10000).toString().padStart(3, '0');
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
