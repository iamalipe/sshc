"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCommand = addCommand;
const chalk = __importStar(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const uuid_1 = require("uuid");
async function addCommand(configManager) {
    console.log(chalk.blue("Adding new SSH connection..."));
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
    console.log(chalk.green(`\nConnection added successfully!`));
    console.log(`ID: ${chalk.cyan(connection.id)}`);
    if (connection.alias)
        console.log(`Alias: ${chalk.cyan(connection.alias)}`);
}
