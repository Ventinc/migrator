const { fs } = require("../index");

module.exports = {
  connection: {
    user: "pgmigrations",
    host: "pg",
    database: "pgmigrations",
    password: "password",
    port: 5432,
  },
  types: [
    {
      name: "migrations",
      folder: fs.basePath,
    },
    {
      name: "seeds",
      folder: fs.basePath,
    },
  ],
};
