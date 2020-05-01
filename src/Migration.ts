import { Client } from "pg";

export class Migration {
  name?: string;

  public async up(client: Client) {
    console.error("No up");
  }

  public async down(client: Client) {
    console.error("No down");
  }
}
