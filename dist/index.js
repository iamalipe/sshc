#!/usr/bin/env node
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
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const config_1 = require("./lib/config");
const program = new commander_1.Command();
const configManager = new config_1.ConfigManager();
async function promptForMasterPassword(isNew = false) {
    const { password } = await inquirer_1.default.prompt([
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
        }
        catch (e) {
            console.error(chalk_1.default.red("Invalid password or corrupted config."));
            process.exit(1);
        }
    }
    else {
        console.log(chalk_1.default.yellow("No existing config found. Initializing..."));
        const password = await promptForMasterPassword(true);
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: "password",
                name: "confirm",
                message: "Confirm master password:",
                mask: "*",
            },
        ]);
        if (password !== confirm) {
            console.error(chalk_1.default.red("Passwords do not match."));
            process.exit(1);
        }
        configManager.setMasterKey(password);
        configManager.save(); // Create empty encrypted file
        console.log(chalk_1.default.green("Config initialized!"));
    }
}
program
    .name("zssh")
    .description("SSH Chain - Encrypted SSH Connection Manager")
    .version("1.0.0")
    .addHelpText("after", `
Example:
  $ zssh add
  $ zssh list
  $ zssh connect my-server
  $ zssh connect 5f3a1
  $ zssh save
  $ zssh sync
`);
program
    .command("add")
    .description("Add a new SSH connection")
    .action(async () => {
    await initConfig();
    const { addCommand } = await Promise.resolve().then(() => __importStar(require("./commands/add")));
    await addCommand(configManager);
});
program
    .command("list")
    .description("List all saved connections")
    .action(async () => {
    await initConfig();
    const { listCommand } = await Promise.resolve().then(() => __importStar(require("./commands/list")));
    await listCommand(configManager);
});
program
    .command("connect <idOrAlias>")
    .description("Connect to a server")
    .action(async (idOrAlias) => {
    await initConfig();
    const { connectCommand } = await Promise.resolve().then(() => __importStar(require("./commands/connect")));
    await connectCommand(configManager, idOrAlias);
});
program
    .command("remove <idOrAlias>")
    .description("Remove a connection")
    .action(async (idOrAlias) => {
    await initConfig();
    const { removeCommand } = await Promise.resolve().then(() => __importStar(require("./commands/remove")));
    await removeCommand(configManager, idOrAlias);
});
program
    .command("save")
    .description("Save config to GitHub Gist")
    .action(async () => {
    await initConfig();
    const { saveCommand } = await Promise.resolve().then(() => __importStar(require("./commands/sync")));
    await saveCommand(configManager);
});
program
    .command("sync")
    .description("Sync config from GitHub Gist")
    .action(async () => {
    await initConfig();
    const { syncCommand } = await Promise.resolve().then(() => __importStar(require("./commands/sync")));
    await syncCommand(configManager);
});
program.parse(process.argv);
