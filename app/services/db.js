/**
 * Database Service
 * 
 * This file sets up the connection to our MySQL database.
 * It uses a connection pool (more efficient than creating a new connection every time)
 * and provides a simple query() function that all models use.
 */

require("dotenv").config();   // Loads our environment variables from the .env file (DB host, user, password, etc.)

const mysql = require('mysql2/promise');   // Modern MySQL library that supports async/await

// Database configuration – pulled from .env file
// Never put real passwords directly in code (this comment is just for demo)
const config = {
    db: {
        host: process.env.DB_CONTAINER,
        port: process.env.DB_PORT,
        user: process.env.MYSQL_ROOT_USER,
        password: process.env.MYSQL_ROOT_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 2,      // Max number of connections we keep open
        queueLimit: 0            // No limit on how many queries can wait
    }
};

// Create the connection pool (reuses connections for better performance)
const pool = mysql.createPool(config.db);

/**
 * Runs any SQL query safely with parameters.
 * This is the function every model (User, Booking, Tutor, etc.) calls.
 */
async function query(sql, params) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

module.exports = {
    query
};