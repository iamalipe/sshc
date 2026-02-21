import axios from "axios";
import chalk from "chalk";
import inquirer from "inquirer";
import { ConfigManager } from "../lib/config";

const GITHUB_API = "https://api.github.com";

async function getGithubToken(configManager: ConfigManager): Promise<string> {
  const config = configManager.getConfig();
  if (config.githubToken) {
    return config.githubToken;
  }

  const { token } = await inquirer.prompt([
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

export async function saveCommand(configManager: ConfigManager) {
  const token = await getGithubToken(configManager);
  const config = configManager.getConfig();
  const encryptedContent = configManager.getEncryptedContent(); // We need a way to get raw encrypted string

  if (!encryptedContent) {
    console.log(chalk.red("Error: Could not retrieve encrypted config."));
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
      console.log(chalk.blue("Updating existing Gist..."));
      await axios.patch(
        `${GITHUB_API}/gists/${config.gistId}`,
        { files },
        {
          headers: { Authorization: `token ${token}` },
        },
      );
      console.log(chalk.green("Config saved to Gist successfully."));
    } else {
      // Create new Gist
      console.log(chalk.blue("Creating new Gist..."));
      const response = await axios.post(
        `${GITHUB_API}/gists`,
        {
          description: "ZSSH Encrypted Config",
          public: false,
          files,
        },
        {
          headers: { Authorization: `token ${token}` },
        },
      );

      const gistId = response.data.id;
      configManager.setGistId(gistId);
      console.log(chalk.green(`Gist created with ID: ${gistId}`));
      console.log(chalk.green("Config saved to Gist successfully."));
    }
  } catch (error: any) {
    console.error(
      chalk.red("Failed to save to Gist:"),
      error.response?.data?.message || error.message,
    );
  }
}

export async function syncCommand(configManager: ConfigManager) {
  const token = await getGithubToken(configManager);
  let { gistId } = configManager.getConfig();

  if (!gistId) {
    const answer = await inquirer.prompt([
      {
        type: "input",
        name: "gistId",
        message: "Enter Gist ID to sync with:",
      },
    ]);
    gistId = answer.gistId as string;
    configManager.setGistId(gistId);
  }

  try {
    console.log(chalk.blue("Fetching Gist..."));
    const response = await axios.get(`${GITHUB_API}/gists/${gistId}`, {
      headers: { Authorization: `token ${token}` },
    });

    const file = response.data.files["zssh_config.lock"];
    if (!file) {
      console.log(chalk.red("Invalid Gist: zssh_config.lock not found."));
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
      console.log(
        chalk.green("Sync completed. Remote changes merged into local config."),
      );
    } else {
      console.log(
        chalk.yellow(
          "Sync completed but no changes were made or merge failed.",
        ),
      );
    }
  } catch (error: any) {
    console.error(
      chalk.red("Failed to sync with Gist:"),
      error.response?.data?.message || error.message,
    );
  }
}
