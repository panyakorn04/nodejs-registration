const mysql = require("mysql2");

// connection to mysql database
const dbCon = mysql
  .createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "edu_api",
  })
  .promise();

module.exports = dbCon;
