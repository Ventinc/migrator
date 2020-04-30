import { path as rootPath } from "app-root-path";
import { Pool, PoolConfig } from "pg";
import { PlatformTools } from "./utils";
import path from "path";
import fs from "fs";

export class Migrator {
  private migrationTable = "migrations";

  private connectionPool: Pool;

  private config: { connection: PoolConfig; migrationsFolder: string };

  constructor(protected options?: { root?: string; configName?: string }) {}

  async boot() {
    this.loadConfig();
    console.log(this.config.connection);
    this.connectionPool = new Pool(this.config.connection);
    await this.makeMigrationTable();
  }

  loadConfig() {
    const root = this.options?.root ?? rootPath;
    const configName = this.options?.configName ?? "migrations.config.js";

    this.config = PlatformTools.esmRequire(path.join(root, configName));
  }

  async runUp() {}

  async runDown(batch: number) {
    console.log(batch);
  }

  async executeMigrations(direction: "up" | "down" = "up", batch: number = 1) {
    await this.makeMigrationTable();
    if (direction === "up") {
      await this.runUp();
    } else {
      await this.runDown(batch);
    }
  }

  createMigration(name: string) {
    console.log(`create migration ${name}`);
  }

  private async makeMigrationTable() {
    const query = `CREATE TABLE IF NOT EXISTS ${this.migrationTable} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL, 
      migration_time DATE NOT NULL DEFAULT now()
    )`;

    await this.connectionPool.query(query);
  }
}
