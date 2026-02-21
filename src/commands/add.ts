import chalk from "chalk";
import inquirer from "inquirer";
import { ConfigManager } from "../lib/config";
import { SSHConnection } from "../lib/types";

export async function addCommand(configManager: ConfigManager) {
  console.log(chalk.blue("Adding new SSH connection..."));

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "host",
      message: "Host (IP or Domain):",
      validate: (input) => (input ? true : "Host is required"),
    },
    {
      type: "input",
      name: "port",
      message: "Port:",
      default: "22",
      validate: (input) =>
        !isNaN(parseInt(input)) ? true : "Port must be a number",
    },
    {
      type: "input",
      name: "username",
      message: "Username:",
      validate: (input) => (input ? true : "Username is required"),
    },
    {
      type: "list",
      name: "authType",
      message: "Authentication Method:",
      choices: ["Password", "Private Key", "Agent (No Password/Key stored)"],
    },
    {
      type: "password",
      name: "password",
      message: "Password:",
      when: (answers) => answers.authType === "Password",
      mask: "*",
    },
    {
      type: "input",
      name: "privateKeyPath",
      message: "Private Key Path:",
      when: (answers) => answers.authType === "Private Key",
      default: "~/.ssh/id_rsa",
    },
    {
      type: "input",
      name: "alias",
      message: "Alias (short name):",
    },
    {
      type: "input",
      name: "description",
      message: "Description (optional):",
    },
  ]);

  const connections = configManager.getConnections();
  const nextId =
    connections.length > 0
      ? (
          Math.max(...connections.map((c) => parseInt(c.id) || 0)) + 1
        ).toString()
      : "1";

  const connection: SSHConnection = {
    id: nextId,
    alias: answers.alias,
    host: answers.host,
    port: parseInt(answers.port),
    username: answers.username,
    password: answers.password,
    privateKeyPath: answers.privateKeyPath,
    description: answers.description,
    createdAt: new Date().toISOString(),
  };

  configManager.addConnection(connection);
  console.log(chalk.green(`\nConnection added successfully!`));
  console.log(`ID: ${chalk.cyan(connection.id)}`);
  if (connection.alias) console.log(`Alias: ${chalk.cyan(connection.alias)}`);
}
