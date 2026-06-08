require('dotenv').config();
const { Pool } = require('pg');
try{
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });
    console.log('Connected to PostgreSQL database successfully!');
    module.exports = pool;
}
catch (error) {
    console.error('Error connecting to PostgreSQL database:', error);
    process.exit(1);
}