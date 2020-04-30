const { join } = require("path");

module.exports = {
  connection: {
    user: "pgmigrations",
    host: "pg",
    database: "pgmigrations",
    password: "password",
    port: 5432,
  },
  migrations: join(__dirname, "migrations.config.js"),
};
