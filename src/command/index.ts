import { program } from "commander";
import { migrationCommand } from "./migrationCommand";
import { createMigration } from "./createMigration";

export const migratorProgram = program
  .version("1.0.0")
  .option("-cd, --config-dir <dir>", "Directory of migrator config")
  .option("-cn, --config-name <name>", "Filename of migrator config");

migratorProgram
  .command("up <typename>")
  .description("Migrate the type up")
  .action((typename, options) => migrationCommand("up", typename, options));

migratorProgram
  .command("down <typename>")
  .description("Migrate the type down")
  .option(
    "-n, --number <number>",
    "How many times to migrate down",
    parseInt,
    1
  )
  .action((typename, options) => migrationCommand("down", typename, options));

migratorProgram
  .command("create <typename> <name>")
  .description("Create a migration file")
  .action(createMigration);
