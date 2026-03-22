// NOTE: dotenv is loaded once at the top of index.js — do NOT call it here.
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host:             process.env.DB_CONTAINER,
    port:             process.env.DB_PORT,
    user:             process.env.MYSQL_ROOT_USER,
    password:         process.env.MYSQL_ROOT_PASSWORD,
    database:         process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit:  10,   // raised from 2 — 2 was dangerously low
    queueLimit:       0,
});

// Utility function to query the database
async function query(sql, params) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

module.exports = { query };