import { join } from "path";
import { camelCase, PlatformTools } from "../utils";
import { createMigrator } from "./createMigrator";
import { logger } from "../logger";
import chalk from "chalk";

function getTemplate(name: string, timestamp: number): string {
  return `
import { Migration, Client } from "@ventinc/migrator";

export class ${camelCase(name, true)}${timestamp} extends Migration {

  public async up(client: Client): Promise<void> {

  }

  public async down(client: Client): Promise<void> {

  }
}
`;
}

export async function createMigration(
  typename: string,
  name: string,
  options: any
) {
  const migrator = createMigrator(options);

  migrator.loadConfig();

  const type = migrator.getType(typename);

  if (!type) {
    throw new Error(`No configuration named: "${name}"`);
  }

  const timestamp = Date.now();
  const folder = type.folder;
  const filename = `${timestamp}-${camelCase(name)}.ts`;
  const path = join(folder, filename);

  await PlatformTools.add(path, getTemplate(name, timestamp));

  logger.log(
    chalk.bgCyan(` ${typename.toUpperCase()} `),
    filename,
    chalk.cyan("has been generated.")
  );
}
