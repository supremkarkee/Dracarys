// Get the functions in the db.js file to use
const db = require('./../services/db');
const bcrypt = require('bcryptjs');

class User {
    // Custom user ID (e.g., student ID or tutor ID)
    userId;
    // First name of the user
    firstName;
    // Last name of the user
    lastName;
    // User's email
    email;
    // User's role (tutor or learner)
    role;

    constructor(email) {
        this.email = email;
    }


    //Get an existing user id from an email address, or return false if not found

    async getIdfromEmail() {
        var sql = "SELECT user_id FROM users WHERE users.email = ?";
        const result = await db.query(sql, [this.email]);
        // TODO LOTS OF ERROR CHECKS HERE..
        if (JSON.stringify(result) != '[]') {
            this.userId = result[0].user_id;
            return this.userId;
        }
        else {
            return false;
        }

    }

    // Add a password to an existing user

    async setUserPassword(password) {
        const pw = await bcrypt.hash(password, 10);
        var sql = "UPDATE users SET password = ? WHERE users.user_id = ?"
        const result = await db.query(sql, [pw, this.userId]);
        return true;
    }

    // Add a new record to the users table

    async addUser(password) {


        const pw = await bcrypt.hash(password, 10);
        var sql = "INSERT INTO Users (email, password) VALUES (? , ?)";
        const result = await db.query(sql, [this.email, pw]);
        console.log(result.insertId);
        this.id = result.insertId;
        return true;
    }

    // Test a submitted password against a stored password

    // Test a submitted password against the stored hashed password
    async authenticate(submitted) {
        const sql = "SELECT password FROM users WHERE user_id = ?";
        const result = await db.query(sql, [this.userId]);

        if (!result || result.length === 0) {
            return false; // User not found
        }

        const match = await bcrypt.compare(submitted, result[0].password);
        return match;
    }

    // Fetches the user details from the database and populates the class properties
    async getDetails() {
        const sql = "SELECT * FROM users WHERE user_id = ?";
        const results = await db.query(sql, [this.userId]);

        if (results.length > 0) {
            this.userId = results[0].user_id;
            this.firstName = results[0].first_name;
            this.lastName = results[0].last_name;
            this.email = results[0].email;
            this.role = results[0].role;
            return true;
        }
        return false;
    }

    // Static method to check if a user already exists before signing up
    static async checkUserExists(email) {
        const sql = 'SELECT user_id FROM users WHERE email = ?';
        const rows = await db.query(sql, [email]);
        return rows.length > 0;
    }

    // Static method to create a new user in the database
    static async createUser(userData) {
        try {
            // Securely hash the password before saving
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            const sql = `
                INSERT INTO users (first_name, last_name, email, password, role)
                VALUES (?, ?, ?, ?, ?)
            `;

            const result = await db.query(sql, [
                userData.firstName,
                userData.lastName,
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

module.exports =
{
    User
};
