"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCommand = addCommand;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const uuid_1 = require("uuid");
async function addCommand(configManager) {
    console.log(chalk_1.default.blue("Adding new SSH connection..."));
    const answers = await inquirer_1.default.prompt([
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
            validate: (input) => !isNaN(parseInt(input)) ? true : "Port must be a number",
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
    const connection = {
        id: (0, uuid_1.v4)().split("-")[0], // Short ID
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
    console.log(chalk_1.default.green(`\nConnection added successfully!`));
    console.log(`ID: ${chalk_1.default.cyan(connection.id)}`);
    if (connection.alias)
        console.log(`Alias: ${chalk_1.default.cyan(connection.alias)}`);
}
