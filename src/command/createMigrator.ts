import { Migrator } from "../Migrator";

export function createMigrator(options: any) {
  const { parent: parentOptions } = options;
  const migratorOptions = {
    root: parentOptions.configDir,
    configName: parentOptions.configName,
  };

  const migrator = new Migrator(migratorOptions);

  return migrator;
}
