import { Migrator } from "../Migrator";
import { createMigrator } from "./createMigrator";

export async function migrationCommand(
  direction: "up" | "down",
  typename: string,
  options: any
) {
  const migrator = createMigrator(options);

  await migrator.boot();

  if (direction === "up") {
    await migrator.executeMigrations("up", typename);
  } else {
    await migrator.executeMigrations("down", typename, options.number);
  }
}
