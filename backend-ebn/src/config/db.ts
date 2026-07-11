import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'admin',
  database: process.env.DB_NAME || 'sistema_ebn',
  port: parseInt(process.env.DB_PORT || '3306'),
  ssl: process.env.DB_HOST ? {
    rejectUnauthorized: false
  } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default db.promise();