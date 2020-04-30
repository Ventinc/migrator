import { Migrator } from "../../src/Migrator";
import { getDb, getMigrator, cleanup } from "../../test-helpers";

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
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  test("Create database on boot", async () => {
    const migrator = getMigrator();

    await migrator.boot();

    const result = await db.query(
      "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename='migrations';"
    );

    expect(result.rows[0].count).toBe("1");
  });
});
