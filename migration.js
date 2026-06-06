require("dotenv").config();
var mysql = require("mysql2");
var migration = require("mysql-migrations");

var connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

migration.init(connection, __dirname + "/src/migrations", function () {
  console.log("finished running migrations");
});
