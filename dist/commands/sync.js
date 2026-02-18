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
exports.saveCommand = saveCommand;
exports.syncCommand = syncCommand;
const axios_1 = __importDefault(require("axios"));
const chalk = __importStar(require("chalk"));
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
        console.log(chalk.red("Error: Could not retrieve encrypted config."));
        return;
    }
    const files = {
        "sshc_config.lock": {
            content: encryptedContent,
        },
    };
    try {
        if (config.gistId) {
            // Update existing Gist
            console.log(chalk.blue("Updating existing Gist..."));
            await axios_1.default.patch(`${GITHUB_API}/gists/${config.gistId}`, { files }, {
                headers: { Authorization: `token ${token}` },
            });
            console.log(chalk.green("Config saved to Gist successfully."));
        }
        else {
            // Create new Gist
            console.log(chalk.blue("Creating new Gist..."));
            const response = await axios_1.default.post(`${GITHUB_API}/gists`, {
                description: "SSHC Encrypted Config",
                public: false,
                files,
            }, {
                headers: { Authorization: `token ${token}` },
            });
            const gistId = response.data.id;
            configManager.setGistId(gistId);
            console.log(chalk.green(`Gist created with ID: ${gistId}`));
            console.log(chalk.green("Config saved to Gist successfully."));
        }
    }
    catch (error) {
        console.error(chalk.red("Failed to save to Gist:"), error.response?.data?.message || error.message);
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
        console.log(chalk.blue("Fetching Gist..."));
        const response = await axios_1.default.get(`${GITHUB_API}/gists/${gistId}`, {
            headers: { Authorization: `token ${token}` },
        });
        const file = response.data.files["sshc_config.lock"];
        if (!file) {
            console.log(chalk.red("Invalid Gist: sshc_config.lock not found."));
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
            console.log(chalk.green("Sync completed. Remote changes merged into local config."));
        }
        else {
            console.log(chalk.yellow("Sync completed but no changes were made or merge failed."));
        }
    }
    catch (error) {
        console.error(chalk.red("Failed to sync with Gist:"), error.response?.data?.message || error.message);
    }
}
