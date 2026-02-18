#!/usr/bin/env node
import * as chalk from "chalk";
import { Command } from "commander";
import inquirer from "inquirer";
import { ConfigManager } from "./lib/config";

const program = new Command();
const configManager = new ConfigManager();

async function promptForMasterPassword(
  isNew: boolean = false,
): Promise<string> {
  const { password } = await inquirer.prompt([
    {
      type: "password",
      name: "password",
      message: isNew
        ? "Set a master password for your encrypted config:"
        : "Enter master password:",
      mask: "*",
    },
  ]);
  return password;
}

async function initConfig() {
  if (configManager.isConfigExists()) {
    const password = await promptForMasterPassword();
    configManager.setMasterKey(password);
    try {
      configManager.load();
    } catch (e) {
      console.error(chalk.red("Invalid password or corrupted config."));
      process.exit(1);
    }
  } else {
    console.log(chalk.yellow("No existing config found. Initializing..."));
    const password = await promptForMasterPassword(true);
    const { confirm } = await inquirer.prompt([
      {
        type: "password",
        name: "confirm",
        message: "Confirm master password:",
        mask: "*",
      },
    ]);

    if (password !== confirm) {
      console.error(chalk.red("Passwords do not match."));
      process.exit(1);
    }

    configManager.setMasterKey(password);
    configManager.save(); // Create empty encrypted file
    console.log(chalk.green("Config initialized!"));
  }
}

program
  .name("sshc")
  .description("SSH Chain - Encrypted SSH Connection Manager")
  .version("1.0.0")
  .addHelpText(
    "after",
    `
Example:
  $ sshc add
  $ sshc list
  $ sshc connect my-server
  $ sshc connect 5f3a1
  $ sshc save
  $ sshc sync
`,
  );

program
  .command("add")
  .description("Add a new SSH connection")
  .action(async () => {
    await initConfig();
    const { addCommand } = await import("./commands/add");
    await addCommand(configManager);
  });

program
  .command("list")
  .description("List all saved connections")
  .action(async () => {
    await initConfig();
    const { listCommand } = await import("./commands/list");
    await listCommand(configManager);
  });

program
  .command("connect <idOrAlias>")
  .description("Connect to a server")
  .action(async (idOrAlias) => {
    await initConfig();
    const { connectCommand } = await import("./commands/connect");
    await connectCommand(configManager, idOrAlias);
  });

program
  .command("remove <idOrAlias>")
  .description("Remove a connection")
  .action(async (idOrAlias) => {
    await initConfig();
    const { removeCommand } = await import("./commands/remove");
    await removeCommand(configManager, idOrAlias);
  });

program
  .command("save")
  .description("Save config to GitHub Gist")
  .action(async () => {
    await initConfig();
    const { saveCommand } = await import("./commands/sync");
    await saveCommand(configManager);
  });

program
  .command("sync")
  .description("Sync config from GitHub Gist")
  .action(async () => {
    await initConfig();
    const { syncCommand } = await import("./commands/sync");
    await syncCommand(configManager);
  });

program.parse(process.argv);
