import { path as rootPath } from "app-root-path";
import { Pool, PoolConfig } from "pg";
import { PlatformTools } from "./utils";
import { join } from "path";
import { readdirSync, existsSync } from "fs";
import { Migration } from "./Migration";
import { Client } from "./Client";
import { logger } from "./logger";
import chalk from "chalk";

interface MigrationConfig {
  name: string;
  folder: string;
}

type ContainedType<T> = { new (...args: any[]): T } | Function;

interface MigrationInformation {
  name: string;
  timestamp: number;
  instance: Migration;
}

export class Migrator {
  private connectionPool: Pool;

  private config: { connection: PoolConfig; types: MigrationConfig[] };

  constructor(protected options?: { root?: string; configName?: string }) {
    this.config = {
      connection: {},
      types: [],
    };
  }

  async boot() {
    this.loadConfig();
    this.connectionPool = new Pool({
      ...this.config.connection,
      idleTimeoutMillis: 0,
    });
    await this.makeTables();
  }

  loadConfig() {
    const root = this.options?.root ?? rootPath;
    const configName = this.options?.configName ?? "migrations.config.js";

    this.config = PlatformTools.esmRequire(join(root, configName));
  }

  async executeMigrations(
    direction: "up" | "down" = "up",
    name: string = "migrations",
    batch: number = 1
  ) {
    const type = this.getType(name);

    if (!type) {
      throw new Error(`No configuration named: "${name}"`);
    }
    const migrations = await this.getMigrations(type);

    if (direction === "up") {
      await this.runUp(migrations, type);
    } else {
      await this.runDown(migrations, batch, type);
    }
  }

  private async runUp(
    migrations: MigrationInformation[],
    type: MigrationConfig
  ) {
    const alreadyMigrated = await this.getMigrated(type.name);

    const toMigrate = migrations.filter(
      (migration) => !alreadyMigrated.includes(migration.name)
    );

    for (const migration of toMigrate) {
      const poolClient = await this.connectionPool.connect();
      const client = new Client(poolClient);

      logger.log(
        `${chalk.bgBlue.bold(
          ` ${type.name.toUpperCase()} `
        )}${chalk.bgGreen.bold(" UP ")}`,
        chalk.bold(migration.name)
      );

      try {
        await client.query("BEGIN");
        await migration.instance.up(client);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        poolClient.release();
      }

      await this.insertMigration(type.name, migration.name);
    }
  }

  private async runDown(
    migrations: MigrationInformation[],
    batch: number,
    type: MigrationConfig
  ) {
    const alreadyMigrated = (await this.getMigrated(type.name)).slice(0, batch);
    const toMigrate = migrations.filter((migration) =>
      alreadyMigrated.includes(migration.name)
    );

    for (const migration of toMigrate) {
      const poolClient = await this.connectionPool.connect();
      const client = new Client(poolClient);

      logger.log(
        `${chalk.bgBlue.bold(` ${type.name.toUpperCase()} `)}${chalk.bgRed.bold(
          " DOWN "
        )}`,
        chalk.bold(migration.name)
      );

      try {
        await client.query("BEGIN");
        await migration.instance.down(client);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        poolClient.release();
      }

      await this.removeMigration(type.name, migration.name);
    }
  }

  private async insertMigration(tableName: string, name: string) {
    const query = `INSERT INTO ${tableName}(name) VALUES ($1)`;

    await this.connectionPool.query(query, [name]);
  }

  private async removeMigration(tableName: string, name: string) {
    const query = `DELETE FROM ${tableName} WHERE name=$1`;

    await this.connectionPool.query(query, [name]);
  }

  private async makeTables() {
    for (const type of this.config.types) {
      const query = `CREATE TABLE IF NOT EXISTS ${type.name} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        timestamp DATE NOT NULL DEFAULT now()
      )`;

      await this.connectionPool.query(query);
    }
  }

  getType(name: string) {
    return this.config.types.find((type) => type.name === name);
  }

  private async getMigrated(tableName: string): Promise<string[]> {
    const query = `SELECT name FROM ${tableName} ORDER BY timestamp DESC`;

    const result = await this.connectionPool.query(query);

    return result.rows.map((row) => row.name);
  }

  private async getMigrations(
    type: MigrationConfig
  ): Promise<MigrationInformation[]> {
    const { folder, name: tableName } = type;

    if (existsSync(folder)) {
      const files = readdirSync(folder);

      const migrations: MigrationInformation[] = files.map((file) => {
        const source: ContainedType<Migration> = PlatformTools.esmRequire(
          join(folder, file)
        );
        const name: string = source.name ?? (source.constructor as any).name;
        const timestamp = parseInt(name.substr(-13));

        if (!timestamp || isNaN(timestamp)) {
          throw new Error(
            `${name} migration name is wrong. Migration class name or string name should have a timestamp suffix.`
          );
        }

        return {
          name,
          instance: new (source as new () => Migration)(),
          timestamp,
        };
      });

      return migrations.sort((a, b) => a.timestamp - b.timestamp);
    }

    return [];
  }
}
