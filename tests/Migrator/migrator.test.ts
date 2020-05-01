import { Migrator } from "../../src/Migrator";
import {
  getDb,
  getMigrator,
  cleanup,
  fs,
  getMigratorMultiple,
} from "../../test-helpers";
import { readdirSync, ensureDir } from "fs-extra";

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

    await expect(result.rows[0].count).toBe("2");
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

    await expect(migrationsResult.rows[0].count).toBe("1");
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

    await expect(migrationsResult.rows[0].count).toBe("0");
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

    await expect(migrationsUpResult1.rows[0].count).toBe("2");

    await migrator.executeMigrations("down");

    const migrationsDownResult1 = await db.query(
      "SELECT COUNT(*) FROM migrations"
    );

    await expect(migrationsDownResult1.rows[0].count).toBe("1");

    await migrator.executeMigrations("up");

    const migrationsUpResult2 = await db.query(
      "SELECT COUNT(*) FROM migrations"
    );

    await expect(migrationsUpResult2.rows[0].count).toBe("2");

    await migrator.executeMigrations("down", "migrations", 200304);

    const migrationsDownResult2 = await db.query(
      "SELECT COUNT(*) FROM migrations"
    );

    await expect(migrationsDownResult2.rows[0].count).toBe("0");
  });
});
