"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCommand = saveCommand;
exports.syncCommand = syncCommand;
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const GITHUB_API = "https://api.github.com";
async function getGithubToken(configManager) {
    const config = configManager.getConfig();
    if (config.githubToken) {
        return config.githubToken;
    }
    const { token } = await inquirer_1.default.prompt([
        {
            type: "password", // or input? token is long.
            name: "token",
            message: "Enter GitHub Personal Access Token (with gist scope):",
            mask: "*",
        },
    ]);
    configManager.setGithubToken(token);
    return token;
}
async function saveCommand(configManager) {
    const token = await getGithubToken(configManager);
    const config = configManager.getConfig();
    const encryptedContent = configManager.getEncryptedContent(); // We need a way to get raw encrypted string
    if (!encryptedContent) {
        console.log(chalk_1.default.red("Error: Could not retrieve encrypted config."));
        return;
    }
    const files = {
        "zssh_config.lock": {
            content: encryptedContent,
        },
    };
    try {
        if (config.gistId) {
            // Update existing Gist
            console.log(chalk_1.default.blue("Updating existing Gist..."));
            await axios_1.default.patch(`${GITHUB_API}/gists/${config.gistId}`, { files }, {
                headers: { Authorization: `token ${token}` },
            });
            console.log(chalk_1.default.green("Config saved to Gist successfully."));
        }
        else {
            // Create new Gist
            console.log(chalk_1.default.blue("Creating new Gist..."));
            const response = await axios_1.default.post(`${GITHUB_API}/gists`, {
                description: "ZSSH Encrypted Config",
                public: false,
                files,
            }, {
                headers: { Authorization: `token ${token}` },
            });
            const gistId = response.data.id;
            configManager.setGistId(gistId);
            console.log(chalk_1.default.green(`Gist created with ID: ${gistId}`));
            console.log(chalk_1.default.green("Config saved to Gist successfully."));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red("Failed to save to Gist:"), error.response?.data?.message || error.message);
    }
}
async function syncCommand(configManager) {
    const token = await getGithubToken(configManager);
    let { gistId } = configManager.getConfig();
    if (!gistId) {
        const answer = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "gistId",
                message: "Enter Gist ID to sync with:",
            },
        ]);
        gistId = answer.gistId;
        configManager.setGistId(gistId);
    }
    try {
        console.log(chalk_1.default.blue("Fetching Gist..."));
        const response = await axios_1.default.get(`${GITHUB_API}/gists/${gistId}`, {
            headers: { Authorization: `token ${token}` },
        });
        const file = response.data.files["zssh_config.lock"];
        if (!file) {
            console.log(chalk_1.default.red("Invalid Gist: zssh_config.lock not found."));
            return;
        }
        const encryptedContent = file.content;
        // Merge strategy:
        // 1. Decrypt remote content
        // 2. Merge connections (Remote adds to Local)
        // 3. Save merged to Local
        // 4. (Optional) Push back to Remote? No, `sync` in this context usually means "pull and apply".
        // Use `save` to push.
        const merged = configManager.mergeEncrypted(encryptedContent);
        if (merged) {
            console.log(chalk_1.default.green("Sync completed. Remote changes merged into local config."));
        }
        else {
            console.log(chalk_1.default.yellow("Sync completed but no changes were made or merge failed."));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red("Failed to sync with Gist:"), error.response?.data?.message || error.message);
    }
}
