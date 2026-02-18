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
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectCommand = connectCommand;
const chalk = __importStar(require("chalk"));
const child_process_1 = require("child_process");
async function isSshpassInstalled() {
    return new Promise((resolve) => {
        const check = (0, child_process_1.spawn)("command", ["-v", "sshpass"]);
        check.on("close", (code) => {
            resolve(code === 0);
        });
    });
}
async function connectCommand(configManager, idOrAlias) {
    const conn = configManager.getConnection(idOrAlias);
    if (!conn) {
        console.log(chalk.red(`Connection not found: ${idOrAlias}`));
        return;
    }
    console.log(chalk.blue(`Connecting to ${conn.alias || conn.id} (${conn.username}@${conn.host})...`));
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
            console.log(chalk.yellow('Warning: "sshpass" is not installed.'));
            console.log(chalk.yellow("Cannot auto-fill password. You will be prompted by SSH."));
            console.log(chalk.dim('Install sshpass (e.g. "brew install sshpass" on Mac) to enable auto-login.'));
        }
    }
    const child = (0, child_process_1.spawn)(command, finalArgs, {
        stdio: "inherit",
        env: env,
    });
    child.on("close", (code) => {
        if (code !== 0) {
            console.log(chalk.red(`\nSSH session ended with code ${code}`));
        }
        else {
            console.log(chalk.green("\nDisconnected."));
        }
    });
}
