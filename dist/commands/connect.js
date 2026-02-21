"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectCommand = connectCommand;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
async function isSshpassInstalled() {
    return new Promise((resolve) => {
        const isWin = process.platform === "win32";
        const checkCommand = isWin ? "where sshpass" : "command -v sshpass";
        (0, child_process_1.exec)(checkCommand, (error) => {
            resolve(!error);
        });
    });
}
async function connectCommand(configManager, idOrAlias) {
    const conn = configManager.getConnection(idOrAlias);
    if (!conn) {
        console.log(chalk_1.default.red(`Connection not found: ${idOrAlias}`));
        return;
    }
    console.log(chalk_1.default.blue(`Connecting to ${conn.alias || conn.id} (${conn.username}@${conn.host})...`));
    const args = [];
    // Port
    if (conn.port) {
        args.push("-p", conn.port.toString());
    }
    // Identity file
    if (conn.privateKeyPath) {
        args.push("-i", conn.privateKeyPath);
    }
    // Destination
    args.push(`${conn.username}@${conn.host}`);
    let command = "ssh";
    let finalArgs = args;
    const env = { ...process.env };
    // Handle Password
    if (conn.password) {
        const hasSshpass = await isSshpassInstalled();
        if (hasSshpass) {
            command = "sshpass";
            // options for sshpass
            // -p password
            // We can also use SSHPASS env var to avoid showing in process list (slightly safer)
            env["SSHPASS"] = conn.password;
            finalArgs = ["-e", "ssh", ...args]; // -e means take password from env
        }
        else {
            console.log(chalk_1.default.yellow('Warning: "sshpass" is not installed.'));
            console.log(chalk_1.default.yellow("Cannot auto-fill password. You will be prompted by SSH."));
            console.log(chalk_1.default.dim('Install sshpass (e.g. "brew install sshpass" on Mac) to enable auto-login.'));
        }
    }
    const child = (0, child_process_1.spawn)(command, finalArgs, {
        stdio: "inherit",
        env: env,
    });
    child.on("close", (code) => {
        if (code !== 0) {
            console.log(chalk_1.default.red(`\nSSH session ended with code ${code}`));
        }
        else {
            console.log(chalk_1.default.green("\nDisconnected."));
        }
    });
}
