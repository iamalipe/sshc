"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCommand = removeCommand;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
async function removeCommand(configManager, idOrAlias) {
    const conn = configManager.getConnection(idOrAlias);
    if (!conn) {
        console.log(chalk_1.default.red(`Connection not found: ${idOrAlias}`));
        return;
    }
    const { confirm } = await inquirer_1.default.prompt([
        {
            type: "confirm",
            name: "confirm",
            message: `Are you sure you want to delete ${conn.alias || conn.id} (${conn.username}@${conn.host})?`,
            default: false,
        },
    ]);
    if (confirm) {
        configManager.removeConnection(idOrAlias);
        console.log(chalk_1.default.green("Connection removed."));
    }
}
