const { join } = require("path");

module.exports = {
  connection: {},
  migrations: join(__dirname, "migrations.config.js"),
};
