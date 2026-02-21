import chalk from "chalk";
import { spawn } from "child_process";
import { ConfigManager } from "../lib/config";

async function isSshpassInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const check = spawn("command", ["-v", "sshpass"]);
    check.on("close", (code) => {
      resolve(code === 0);
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
