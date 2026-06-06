// //const { Pool } = require("pg");
// import dotenv from "dotenv";
// import { Pool, PoolClient } from "pg";
// dotenv.config();

// // Create a connection pool
// const pool: Pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: parseInt(process.env.DB_PORT ?? ""),
// });

// //Used to execute raw sql query using pooled connection
// const query = async (query: string) => {
//   try {
//     const client: PoolClient = await pool.connect();
//     const { rows } = await client.query(query);

//     client.release(); // Release the client back to the pool
//     return rows;
//   } catch (err) {
//     console.error("Error executing query", err);
//   }
// };

// //Used to execute database function using pooled connection
// const callDBFunction = async (query: string, params: any[] = []) => {
//   try {
//     const client: PoolClient = await pool.connect();
//     const { rows } = await client.query(query, params);

//     client.release(); // Release the client back to the pool
//     return rows[0];
//   } catch (err) {
//     console.error("Error executing function", err);
//   }
// };

// module.exports = {
//   query,
//   callDBFunction,
// };

const mysql = require("mysql2/promise");
require("dotenv").config();

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10, // Adjust according to your needs
  queueLimit: 0, // 0 means no limit
});

async function query(sql: any, params: any) {
  let connection;
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();

    // Execute the query
    const [results] = await connection.query(sql, params);
    return results;
  } catch (error) {
    // Handle the error as needed
    console.error("Database query error:", error);
    throw error;
  } finally {
    // Ensure the connection is released back to the pool
    if (connection) connection.release();
  }
}

module.exports = {
  query,
};
