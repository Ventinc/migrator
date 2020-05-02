# @ventinc/migrator

A simple postgresql migrator that work with raw query

## Intallation

NPM:
`npm i -S @ventinc/migrator`

YARN:
`yarn add -D @ventinc/migrator`

## Configuration

Configuration is mandatory to make CLI and migrator work.
This library use node postgres so connection just need to be a pool configuration: you can see it [here](https://node-postgres.com/api/pool)

By default the name of configuration file is: `migrations.config.js`.
Create this file next to your project package.json

```javascript
module.exports = {
  connection: {
    user: "root",
    host: "localhost",
    database: "databasename",
    password: "password",
    port: 5432,
  },
  types: [
    {
      name: "migrations",
      folder: __dirname + "/migrations",
    },
  ],
};
```

You can create multiple types to make differents migrations like seeds to populate your database.

## How work CLI

Add this in package.json

```json
{
  ...
  "scripts": {
    "migrator": "migrator"
  }
  ...
}
```

and run `yarn migrator` or `npm run migrator` in your terminal
