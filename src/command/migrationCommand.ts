import { Migrator } from "../Migrator";

export async function migrationCommand(
  direction: "up" | "down",
  typename: string,
  options: any
) {
  const { parent: parentOptions } = options;
  const migratorOptions = {
    root: parentOptions.configDir,
    configName: parentOptions.configName,
  };

  const migrator = new Migrator(migratorOptions);

  await migrator.boot();

  if (direction === "up") {
    await migrator.executeMigrations("up", typename);
  } else {
    await migrator.executeMigrations("down", typename, options.number);
  }
}
