import fsExtra from "fs-extra";
import { join, isAbsolute } from "path";
import { tmpdir } from "os";
import { path as rootPath } from "app-root-path";
import { PoolConfig, Pool } from "pg";
import { Migrator } from "../src/Migrator";

export const dbConfig: PoolConfig = {
  user: "pgmigrations",
  host: "127.0.0.1",
  database: "pgmigrations",
  password: "password",
  port: 5432,
};

export class FileSystem {
  constructor(public basePath = join(tmpdir(), `${new Date().getTime()}`)) {}

  /**
   * Makes abs path to a given file
   */
  private makePath(filePath: string): string {
    return isAbsolute(filePath) ? filePath : join(this.basePath, filePath);
  }

  /**
   * Add a new file with given contents
   */
  public async add(filePath: string, contents: string): Promise<void> {
    const absPath = this.makePath(filePath);
    await fsExtra.outputFile(absPath, contents);
  }

  /**
   * Creates base path dir (if missing)
   */
  ensureDir() {
    return fsExtra.ensureDir(this.basePath);
  }

  /**
   * Remove file
   */
  public async remove(filePath: string): Promise<void> {
    const absPath = this.makePath(filePath);
    await fsExtra.remove(absPath);
  }

  /**
   * Cleanup all files and modules cache (if any)
   */
  public async cleanup(): Promise<void> {
    await fsExtra.remove(this.basePath);
  }
}

export const fs = new FileSystem(rootPath);

export async function createConfig() {
  try {
    await fs.add(
      "migrations.config.js",
      "\
      module.exports = {\
        poolConnection: undefined,\
        migrationFolder: `${__dirname}/migrations`\
      }\
      "
    );
  } catch (err) {
    throw err;
  }
}

export async function setup() {
  await createConfig();
}

export function getDb() {
  return new Pool({
    user: "pgmigrations",
    host: "pg",
    database: "pgmigrations",
    password: "password",
    port: 5432,
  });
}

export function getMigrator() {
  return new Migrator({
    root: __dirname,
    configName: "configs/migrations.config.js",
  });
}

export async function cleanup() {
  const db = getDb();

  const result = await db.query(
    "select 'drop table if exists \"' || tablename || '\" cascade;' as query from pg_tables WHERE schemaname = 'public';"
  );

  result.rows.map(async (row) => await db.query(row.query));

  await db.end();
}
