import chalk from "chalk";
import { exec, spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { utils } from "ssh2";
import { ConfigManager } from "../lib/config";

async function isSshpassInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const isWin = process.platform === "win32";
    const checkCommand = isWin ? "where sshpass" : "command -v sshpass";

    exec(checkCommand, (error) => {
      resolve(!error);
    });
  });
}

export async function connectCommand(
  configManager: ConfigManager,
  idOrAlias: string,
) {
  const conn = configManager.getConnection(idOrAlias);

  if (!conn) {
    console.log(chalk.red(`Connection not found: ${idOrAlias}`));
    return;
  }

  console.log(
    chalk.blue(
      `Connecting to ${conn.alias || conn.id} (${conn.username}@${conn.host})...`,
    ),
  );

  const args: string[] = [];

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
          realPath = path.join(os.homedir(), realPath.slice(2));
        }
        const keyData = fs.readFileSync(realPath);
        const parsedKeys = utils.parseKey(keyData);

        if (parsedKeys instanceof Error) {
          console.log(
            chalk.red(`Failed to parse PPK file: ${parsedKeys.message}`),
          );
          return;
        }

        const parsedKey = Array.isArray(parsedKeys)
          ? parsedKeys[0]
          : parsedKeys;
        const tempKeyPath = path.join(os.tmpdir(), `sshc_key_${conn.id}.pem`);

        fs.writeFileSync(tempKeyPath, parsedKey.getPrivatePEM(), {
          mode: 0o600,
        });
        keyPath = tempKeyPath;

        const cleanUp = () => {
          try {
            if (fs.existsSync(tempKeyPath)) fs.unlinkSync(tempKeyPath);
          } catch (e) {}
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
      } catch (err: any) {
        console.log(chalk.red(`Error processing PPK file: ${err.message}`));
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
    } else {
      console.log(chalk.yellow('Warning: "sshpass" is not installed.'));
      console.log(
        chalk.yellow("Cannot auto-fill password. You will be prompted by SSH."),
      );
      console.log(
        chalk.dim(
          'Install sshpass (e.g. "brew install sshpass" on Mac) to enable auto-login.',
        ),
      );
    }
  }

  const child = spawn(command, finalArgs, {
    stdio: "inherit",
    env: env,
  });

  child.on("close", (code) => {
    if (code !== 0) {
      console.log(chalk.red(`\nSSH session ended with code ${code}`));
    } else {
      console.log(chalk.green("\nDisconnected."));
    }
  });
}
