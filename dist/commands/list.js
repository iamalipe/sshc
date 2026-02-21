"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCommand = listCommand;
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
async function listCommand(configManager) {
    const connections = configManager.getConnections();
    if (connections.length === 0) {
        console.log(chalk_1.default.yellow('No connections found. Use "zssh add" to add one.'));
        return;
    }
    const table = new cli_table3_1.default({
        head: [
            chalk_1.default.cyan("ID"),
            chalk_1.default.cyan("Alias"),
            chalk_1.default.cyan("Host"),
            chalk_1.default.cyan("User"),
            chalk_1.default.cyan("Port"),
            chalk_1.default.cyan("Description"),
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
            conn.description || "",
        ]);
    });
    console.log(table.toString());
}
