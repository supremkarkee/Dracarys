// Get the functions in the db.js file to use
const db = require('./../services/db');
const bcrypt = require('bcryptjs');

class User {
    // Database ID
    id;
    // Custom user ID (e.g., student ID or tutor ID)
    userId;
    // Full name of the user
    fullName;
    // User's email
    email;
    // User's role (tutor or learner)
    role;

    constructor(id) {
        this.id = id;
    }

    // Fetches the user details from the database and populates the class properties
    async getDetails() {
        const sql = "SELECT * FROM users WHERE id = ?";
        const results = await db.query(sql, [this.id]);
        
        if (results.length > 0) {
            this.userId = results[0].user_id;
            this.fullName = results[0].full_name;
            this.email = results[0].email;
            this.role = results[0].role;
            return true;
        }
        return false;
    }

    // Static method to check if a user already exists before signing up
    static async checkUserExists(email, userId) {
        const sql = 'SELECT id FROM users WHERE email = ? OR user_id = ?';
        const rows = await db.query(sql, [email, userId]);
        return rows.length > 0;
    }

    // Static method to create a new user in the database
    static async createUser(userData) {
        try {
            // Securely hash the password before saving
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            const sql = `
                INSERT INTO users (user_id, full_name, email, password_hash, role)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const result = await db.query(sql, [
                userData.userId,
                userData.fullName,
                userData.email,
                hashedPassword,
                userData.role
            ]);

            // Return a new instance of the User class using the newly created ID
            return new User(result.insertId);
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    }
}

module.exports = {
    User
};
