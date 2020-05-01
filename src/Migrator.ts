import { path as rootPath } from "app-root-path";
import { Pool, PoolConfig } from "pg";
import { PlatformTools } from "./utils";
import path from "path";
import { readdirSync, existsSync } from "fs";

interface migrationConfig {
  name: string;
  tableName?: string;
  folder: string;
}

export class Migrator {
  private connectionPool: Pool;

  private config: { connection: PoolConfig; types: migrationConfig[] };

  constructor(protected options?: { root?: string; configName?: string }) {}

  async boot() {
    this.loadConfig();
    this.connectionPool = new Pool(this.config.connection);
    await this.makeTables();
  }

  loadConfig() {
    const root = this.options?.root ?? rootPath;
    const configName = this.options?.configName ?? "migrations.config.js";

    this.config = PlatformTools.esmRequire(path.join(root, configName));
  }

  private async runUp() {}

  private async runDown(batch: number) {
    console.log(batch);
  }

  async executeMigrations(
    direction: "up" | "down" = "up",
    name: string = "migrations",
    batch: number = 1
  ) {
    await this.loadMigrations();

    if (direction === "up") {
      await this.runUp();
    } else {
      await this.runDown(batch);
    }
  }

  createMigration(name: string) {
    console.log(`create migration ${name}`);
  }

  private async makeTables() {
    for (const type of this.config.types) {
      const query = `CREATE TABLE IF NOT EXISTS ${type.tableName ?? type.name} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        migration_time DATE NOT NULL DEFAULT now()
      )`;

      await this.connectionPool.query(query);
    }
  }

  private async loadMigrations(name: string = "migrations") {
    const type = this.config.types.find((type) => type.name === name);
    if (type && type.folder && existsSync(type.folder)) {
      console.log(readdirSync(type.folder));
    }
  }
}
