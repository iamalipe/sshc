import * as chalk from "chalk";
import Table from "cli-table3";
import { ConfigManager } from "../lib/config";

export async function listCommand(configManager: ConfigManager) {
  const connections = configManager.getConnections();

  if (connections.length === 0) {
    console.log(
      chalk.yellow('No connections found. Use "zssh add" to add one.'),
    );
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan("ID"),
      chalk.cyan("Alias"),
      chalk.cyan("Host"),
      chalk.cyan("User"),
      chalk.cyan("Port"),
    ],
    style: { head: [], border: [] },
  });

  connections.forEach((conn) => {
    table.push([
      conn.id,
      conn.alias || "",
      conn.host,
      conn.username,
      conn.port,
    ]);
  });

  console.log(table.toString());
}
