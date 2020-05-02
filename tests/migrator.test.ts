import { Migrator } from "../src/Migrator";
import {
  getDb,
  getMigrator,
  cleanup,
  fs,
  getMigratorMultiple,
} from "../test-helpers";

describe("Config Reader", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("throw without a valid configuration file", () => {
    const migrator = new Migrator({
      root: __dirname,
      configName: "configs/error.config.js",
    });

    expect(async () => {
      await migrator.boot();
    }).rejects.toThrow();
  });

  test("load the config file", () => {
    const migrator = new Migrator({
      root: __dirname,
      configName: "configs/migrations.config.js",
    });

    expect(async () => {
      await migrator.loadConfig();
    }).not.toThrow();
  });
});

let db: ReturnType<typeof getDb>;

describe("Migrator", () => {
  beforeAll(async () => {
    db = getDb();
  });

  afterAll(async () => {
    await db.end();
  });

  beforeEach(async () => {
    fs.ensureDir();
  });

  afterEach(async () => {
    await cleanup();
  });

  test("Create the migrations database on boot", async () => {
    const migrator = getMigrator();

    await migrator.boot();

    const result = await db.query(
      "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename='migrations';"
    );

    expect(result.rows[0].count).toBe("1");
  });

  test("Create multiple databases on boot", async () => {
    const migrator = getMigratorMultiple();

    await migrator.boot();

    const result = await db.query(
      "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public'"
    );

    expect(result.rows[0].count).toBe("2");
  });

  test("Run type that does not exist throw an error", async () => {
    const migrator = getMigrator();

    await migrator.boot();

    expect(
      async () => await migrator.executeMigrations("up", "toto")
    ).rejects.toThrow();
  });

  test("Add entry to database on migrations up", async () => {
    const migrator = getMigrator();

    await migrator.boot();

    const timestamp1 = Date.now();

    await fs.add(
      `${timestamp1}-AddTableUser.ts`,
      `
      import { Migration, Client } from '/usr/src/app/src'

      export default class AddTableUser${timestamp1} implements Migration {
        async up(client: Client) {
        }

        async down(client: Client) {
        }
      }
      `
    );

    await migrator.executeMigrations("up");

    const migrationsResult = await db.query("SELECT COUNT(*) FROM migrations");

    expect(migrationsResult.rows[0].count).toBe("1");
  });

  test("Remove entry to database on migrations up", async () => {
    const migrator = getMigrator();

    await migrator.boot();

    const timestamp1 = Date.now();

    await fs.add(
      `${timestamp1}-AddTableUser.ts`,
      `
      import { Migration, Client } from '/usr/src/app/src'

      export default class AddTableUser${timestamp1} implements Migration {
        async up(client: Client) {
        }

        async down(client: Client) {
        }
      }
      `
    );

    await migrator.executeMigrations("up");
    await migrator.executeMigrations("down");

    const migrationsResult = await db.query("SELECT COUNT(*) FROM migrations");

    expect(migrationsResult.rows[0].count).toBe("0");
  });

  test("Full test with add and remove with batch value", async () => {
    const migrator = getMigrator();

    await migrator.boot();

    const timestamp1 = Date.now();
    const timestamp2 = Date.now() + 500;

    await fs.add(
      `${timestamp2}-AddTablePost.ts`,
      `
      import { Migration, Client } from '/usr/src/app/src'

      export default class AddTablePost${timestamp2} implements Migration {
        async up(client: Client) {
        }

        async down(client: Client) {
        }
      }
      `
    );

    await fs.add(
      `${timestamp1}-AddTableUser.ts`,
      `
      import { Migration, Client } from '/usr/src/app/src'

      export default class AddTableUser${timestamp1} implements Migration {
        async up(client: Client) {
        }

        async down(client: Client) {
        }
      }
      `
    );

    await migrator.executeMigrations("up");

    const migrationsUpResult1 = await db.query(
      "SELECT COUNT(*) FROM migrations"
    );

    expect(migrationsUpResult1.rows[0].count).toBe("2");

    await migrator.executeMigrations("down");

    const migrationsDownResult1 = await db.query(
      "SELECT COUNT(*) FROM migrations"
    );

    expect(migrationsDownResult1.rows[0].count).toBe("1");

    await migrator.executeMigrations("up");

    const migrationsUpResult2 = await db.query(
      "SELECT COUNT(*) FROM migrations"
    );

    expect(migrationsUpResult2.rows[0].count).toBe("2");

    await migrator.executeMigrations("down", "migrations", 200304);

    const migrationsDownResult2 = await db.query(
      "SELECT COUNT(*) FROM migrations"
    );

    expect(migrationsDownResult2.rows[0].count).toBe("0");
  });

  test("Create users table in database on migrations up", async () => {
    const migrator = getMigrator();

    await migrator.boot();

    const timestamp1 = Date.now();

    await fs.add(
      `${timestamp1}-AddTableUser.ts`,
      `
      import { Migration, Client } from '/usr/src/app/src'

      export default class AddTableUser${timestamp1} implements Migration {
        async up(client: Client) {
          await client.query(\`CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL 
          )\`);
        }

        async down(client: Client) {
          await client.query("DROP TABLE users");
        }
      }
      `
    );

    await migrator.executeMigrations("up");

    const migrationsResult = await db.query("SELECT COUNT(*) FROM migrations");
    const userTableResult = await db.query(
      "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename='users';"
    );

    expect(migrationsResult.rows[0].count).toBe("1");
    expect(userTableResult.rows[0].count).toBe("1");
  });

  test("Remove users table in database on migrations down", async () => {
    const migrator = getMigrator();

    await migrator.boot();

    const timestamp1 = Date.now();

    await fs.add(
      `${timestamp1}-AddTableUser.ts`,
      `
      import { Migration, Client } from '/usr/src/app/src'

      export default class AddTableUser${timestamp1} implements Migration {
        async up(client: Client) {
          await client.query(\`CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL 
          )\`);
        }

        async down(client: Client) {
          await client.query("DROP TABLE users");
        }
      }
      `
    );

    await migrator.executeMigrations("up");

    const migrationsResultUp = await db.query(
      "SELECT COUNT(*) FROM migrations"
    );
    const userTableResultUp = await db.query(
      "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename='users';"
    );

    expect(migrationsResultUp.rows[0].count).toBe("1");
    expect(userTableResultUp.rows[0].count).toBe("1");

    await migrator.executeMigrations("down");

    const migrationsResultDown = await db.query(
      "SELECT COUNT(*) FROM migrations"
    );
    const userTableResultDown = await db.query(
      "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename='users';"
    );

    expect(migrationsResultDown.rows[0].count).toBe("0");
    expect(userTableResultDown.rows[0].count).toBe("0");
  });

  test("Rollback when error on up", async () => {
    const migrator = getMigrator();

    await migrator.boot();

    const timestamp1 = Date.now();

    await fs.add(
      `${timestamp1}-AddTableUser.ts`,
      `
      import { Migration, Client } from '/usr/src/app/src'

      export default class AddTableUser${timestamp1} implements Migration {
        async up(client: Client) {
          await client.query(\`CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL 
          )\`);

          await client.query("SELECT * FROM toto");
        }

        async down(client: Client) {
          await client.query("DROP TABLE users");
        }
      }
      `
    );

    expect(
      async () => await migrator.executeMigrations("up")
    ).rejects.toThrow();

    const migrationsResult = await db.query("SELECT COUNT(*) FROM migrations");
    const userTableResult = await db.query(
      "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename='users';"
    );

    expect(migrationsResult.rows[0].count).toBe("0");
    expect(userTableResult.rows[0].count).toBe("0");
  });

  test("Rollback when error on down", async () => {
    const migrator = getMigrator();

    await migrator.boot();

    const timestamp1 = Date.now();

    await fs.add(
      `${timestamp1}-AddTableUser.ts`,
      `
      import { Migration, Client } from '/usr/src/app/src'

      export default class AddTableUser${timestamp1} implements Migration {
        async up(client: Client) {
          await client.query(\`CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL 
          )\`);
        }
        
        async down(client: Client) {
          await client.query("DROP TABLE users");
          await client.query("SELECT * FROM toto");
        }
      }
      `
    );

    await migrator.executeMigrations("up");

    expect(
      async () => await migrator.executeMigrations("down")
    ).rejects.toThrow();

    const migrationsResult = await db.query("SELECT COUNT(*) FROM migrations");
    const userTableResult = await db.query(
      "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename='users';"
    );

    expect(migrationsResult.rows[0].count).toBe("1");
    expect(userTableResult.rows[0].count).toBe("1");
  });
});
