import { cli, getDb, fs, cleanup, setupTmpConfig } from "../test-helpers";
import { readdirSync, readFileSync } from "fs";

let db: ReturnType<typeof getDb>;

describe("cli", () => {
  beforeAll(async () => {
    db = getDb();
    await setupTmpConfig();
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

  test("Can run migration up", async () => {
    const timestamp = Date.now();

    await fs.add(
      `${timestamp}-AddTableUser.ts`,
      `
      import { Migration, Client } from '/usr/src/app/src'

      export default class AddTableUser${timestamp} implements Migration {
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

    await cli(["up", "migrations"]);

    const migrationsResult = await db.query("SELECT COUNT(*) FROM migrations");
    const userTableResult = await db.query(
      "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename='users';"
    );

    expect(migrationsResult.rows[0].count).toBe("1");
    expect(userTableResult.rows[0].count).toBe("1");
  });

  test("Can run migration down", async () => {
    const timestamp = Date.now();

    await fs.add(
      `${timestamp}-AddTableUser.ts`,
      `
      import { Migration, Client } from '/usr/src/app/src'

      export default class AddTableUser${timestamp} implements Migration {
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

    await cli(["up", "migrations"]);

    const migrationsResultUp = await db.query(
      "SELECT COUNT(*) FROM migrations"
    );
    const userTableResultUp = await db.query(
      "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename='users';"
    );

    expect(migrationsResultUp.rows[0].count).toBe("1");
    expect(userTableResultUp.rows[0].count).toBe("1");

    await cli(["down", "migrations"]);

    const migrationsResultDown = await db.query(
      "SELECT COUNT(*) FROM migrations"
    );
    const userTableResultDown = await db.query(
      "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename='users';"
    );

    expect(migrationsResultDown.rows[0].count).toBe("0");
    expect(userTableResultDown.rows[0].count).toBe("0");
  });

  test("Create migration", async () => {
    await cli(["create", "migrations", "create users table"]);

    const files = readdirSync(fs.basePath);
    const file = readFileSync(fs.basePath + "/" + files[0]).toString();

    console.log(file);

    expect(files).toHaveLength(1);
  });
});
