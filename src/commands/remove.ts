import chalk from "chalk";
import inquirer from "inquirer";
import { ConfigManager } from "../lib/config";

export async function removeCommand(
  configManager: ConfigManager,
  idOrAlias: string,
) {
  const conn = configManager.getConnection(idOrAlias);

  if (!conn) {
    console.log(chalk.red(`Connection not found: ${idOrAlias}`));
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Are you sure you want to delete ${conn.alias || conn.id} (${conn.username}@${conn.host})?`,
      default: false,
    },
  ]);

  if (confirm) {
    configManager.removeConnection(idOrAlias);
    console.log(chalk.green("Connection removed."));
  }
}
