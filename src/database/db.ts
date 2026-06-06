// import { Sequelize } from "sequelize";
// import dotenv from "dotenv";
// import { Pool, PoolClient } from "pg";

// dotenv.config();

// export const sequelize = new Sequelize(
//   process.env.DB_NAME!,
//   process.env.DB_USER!,
//   process.env.DB_PASSWORD!,
//   {
//     host: process.env.DB_HOST,
//     dialect: "mysql",
//   }
// );

// sequelize
//   .authenticate()
//   .then(() => console.log("Database connected..."))
//   .catch((err: Error) => console.log("Error: " + err));

import { Sequelize, Dialect } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const dialect = (process.env.DB_DIALECT || "postgres") as Dialect;

export const sequelize = new Sequelize(
  process.env.DB_DATABASE!,
  process.env.DB_USERNAME!,
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect,
    logging: false,
  }
);

sequelize
  .authenticate()
  .then(() => console.log("Sequelize database connected..."))
  .catch((err: Error) => console.log("Sequelize connection error (non-fatal):", err.message));
