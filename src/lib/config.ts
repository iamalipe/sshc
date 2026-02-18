import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { decrypt, encrypt } from "./crypto";
import { Config, SSHConnection } from "./types";

const CONFIG_PATH = path.join(os.homedir(), ".sshc.json");

export class ConfigManager {
  private config: Config;
  private masterKey: string | null = null;

  constructor() {
    this.config = {
      connections: [],
    };
  }

  public setMasterKey(key: string) {
    this.masterKey = key;
  }

  public load(): boolean {
    if (!fs.existsSync(CONFIG_PATH)) {
      return true; // New config
    }

    try {
      const fileContent = fs.readFileSync(CONFIG_PATH, "utf-8");

      // Try parsing as plain JSON first (migration or initial unencrypted)
      try {
        const plain = JSON.parse(fileContent);
        if (plain.connections) {
          this.config = plain;
          return true;
        }
      } catch (e) {
        // Not plain JSON, likely encrypted string or object
      }

      // If we are here, it's likely encrypted.
      // We expect the file to contain just the encrypted string or { data: '...' }
      // For simplicity let's assume the file content IS the encrypted string if not JSON
      // Or we wrap it. Let's assume we wrap it to be safe.

      let encryptedData = fileContent;
      try {
        const wrapped = JSON.parse(fileContent);
        if (wrapped.encrypted) {
          encryptedData = wrapped.encrypted;
        }
      } catch (e) {
        // It's raw encrypted string
      }

      if (!this.masterKey) {
        throw new Error("Master key required to decrypt config");
      }

      const decrypted = decrypt(encryptedData, this.masterKey);
      this.config = JSON.parse(decrypted);
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Master key required")
      ) {
        throw error;
      }
      // wrong password or corrupted
      throw new Error(
        "Failed to load config: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  public getConfig(): Config {
    return this.config;
  }

  public setGithubToken(token: string) {
    this.config.githubToken = token;
    this.save();
  }

  public setGistId(id: string) {
    this.config.gistId = id;
    this.save();
  }

  public getEncryptedContent(): string | null {
    if (!this.masterKey) return null;
    const json = JSON.stringify(this.config);
    return encrypt(json, this.masterKey);
  }

  public mergeEncrypted(encryptedContent: string): boolean {
    if (!this.masterKey) return false;
    try {
      const decrypted = decrypt(encryptedContent, this.masterKey);
      const remoteConfig: Config = JSON.parse(decrypted);

      let changed = false;
      remoteConfig.connections.forEach((remoteConn) => {
        if (!this.config.connections.find((c) => c.id === remoteConn.id)) {
          this.config.connections.push(remoteConn);
          changed = true;
        }
        // Could add logic to update existing ones if newer
      });

      if (changed) {
        this.save();
      }
      return true;
    } catch (e: any) {
      console.error("Failed to decrypt and merge remote config:", e.message);
      return false;
    }
  }

  public save() {
    if (!this.masterKey) {
      throw new Error("Master key required to save config");
    }

    const json = JSON.stringify(this.config);
    const encrypted = encrypt(json, this.masterKey);

    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ encrypted }), "utf-8");
  }

  public getConnections(): SSHConnection[] {
    return this.config.connections;
  }

  public addConnection(connection: SSHConnection) {
    this.config.connections.push(connection);
    this.save();
  }

  public removeConnection(idOrAlias: string) {
    this.config.connections = this.config.connections.filter(
      (c) => c.id !== idOrAlias && c.alias !== idOrAlias,
    );
    this.save();
  }

  public getConnection(idOrAlias: string): SSHConnection | undefined {
    return this.config.connections.find(
      (c) => c.id === idOrAlias || c.alias === idOrAlias,
    );
  }

  public isConfigExists(): boolean {
    return fs.existsSync(CONFIG_PATH);
  }
}
