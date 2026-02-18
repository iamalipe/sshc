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
exports.ConfigManager = void 0;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const crypto_1 = require("./crypto");
const CONFIG_PATH = path.join(os.homedir(), ".sshc.json");
class ConfigManager {
    constructor() {
        this.masterKey = null;
        this.config = {
            connections: [],
        };
    }
    setMasterKey(key) {
        this.masterKey = key;
    }
    load() {
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
            }
            catch (e) {
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
            }
            catch (e) {
                // It's raw encrypted string
            }
            if (!this.masterKey) {
                throw new Error("Master key required to decrypt config");
            }
            const decrypted = (0, crypto_1.decrypt)(encryptedData, this.masterKey);
            this.config = JSON.parse(decrypted);
            return true;
        }
        catch (error) {
            if (error instanceof Error &&
                error.message.includes("Master key required")) {
                throw error;
            }
            // wrong password or corrupted
            throw new Error("Failed to load config: " +
                (error instanceof Error ? error.message : String(error)));
        }
    }
    getConfig() {
        return this.config;
    }
    setGithubToken(token) {
        this.config.githubToken = token;
        this.save();
    }
    setGistId(id) {
        this.config.gistId = id;
        this.save();
    }
    getEncryptedContent() {
        if (!this.masterKey)
            return null;
        const json = JSON.stringify(this.config);
        return (0, crypto_1.encrypt)(json, this.masterKey);
    }
    mergeEncrypted(encryptedContent) {
        if (!this.masterKey)
            return false;
        try {
            const decrypted = (0, crypto_1.decrypt)(encryptedContent, this.masterKey);
            const remoteConfig = JSON.parse(decrypted);
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
        }
        catch (e) {
            console.error("Failed to decrypt and merge remote config:", e.message);
            return false;
        }
    }
    save() {
        if (!this.masterKey) {
            throw new Error("Master key required to save config");
        }
        const json = JSON.stringify(this.config);
        const encrypted = (0, crypto_1.encrypt)(json, this.masterKey);
        fs.writeFileSync(CONFIG_PATH, JSON.stringify({ encrypted }), "utf-8");
    }
    getConnections() {
        return this.config.connections;
    }
    addConnection(connection) {
        this.config.connections.push(connection);
        this.save();
    }
    removeConnection(idOrAlias) {
        this.config.connections = this.config.connections.filter((c) => c.id !== idOrAlias && c.alias !== idOrAlias);
        this.save();
    }
    getConnection(idOrAlias) {
        return this.config.connections.find((c) => c.id === idOrAlias || c.alias === idOrAlias);
    }
    isConfigExists() {
        return fs.existsSync(CONFIG_PATH);
    }
}
exports.ConfigManager = ConfigManager;
