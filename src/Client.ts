import { PoolClient } from "pg";
import chalk from "chalk";
import { logger } from "./logger";

export class Client {
  constructor(protected client: PoolClient) {}

  public query(text: string, values?: any[]) {
    logger.log(
      chalk.magenta.bold("SQL"),
      chalk.blue.bold(text),
      values ? values : ""
    );
    return this.client.query(text, values);
  }
}
