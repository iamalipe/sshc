"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectCommand = connectCommand;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const ssh2_1 = require("ssh2");
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
        let keyPath = conn.privateKeyPath;
        if (keyPath.toLowerCase().endsWith(".ppk")) {
            try {
                let realPath = keyPath;
                if (realPath.startsWith("~/")) {
                    realPath = path_1.default.join(os_1.default.homedir(), realPath.slice(2));
                }
                const keyData = fs_1.default.readFileSync(realPath);
                const parsedKeys = ssh2_1.utils.parseKey(keyData);
                if (parsedKeys instanceof Error) {
                    console.log(chalk_1.default.red(`Failed to parse PPK file: ${parsedKeys.message}`));
                    return;
                }
                const parsedKey = Array.isArray(parsedKeys)
                    ? parsedKeys[0]
                    : parsedKeys;
                const tempKeyPath = path_1.default.join(os_1.default.tmpdir(), `sshc_key_${conn.id}.pem`);
                fs_1.default.writeFileSync(tempKeyPath, parsedKey.getPrivatePEM(), {
                    mode: 0o600,
                });
                keyPath = tempKeyPath;
                const cleanUp = () => {
                    try {
                        if (fs_1.default.existsSync(tempKeyPath))
                            fs_1.default.unlinkSync(tempKeyPath);
                    }
                    catch (e) { }
                };
                process.on("exit", cleanUp);
                process.on("SIGINT", () => {
                    cleanUp();
                    process.exit(0);
                });
                process.on("SIGTERM", () => {
                    cleanUp();
                    process.exit(0);
                });
            }
            catch (err) {
                console.log(chalk_1.default.red(`Error processing PPK file: ${err.message}`));
                return;
            }
        }
        args.push("-i", keyPath);
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
