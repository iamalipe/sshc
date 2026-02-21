import * as keytar from "keytar";

const SERVICE_NAME = "zssh";
const ACCOUNT_NAME = "session";
const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface SessionData {
  password: string;
  expiresAt: number;
}

export async function getSessionPassword(): Promise<string | null> {
  try {
    const dataString = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    if (!dataString) return null;

    const data: SessionData = JSON.parse(dataString);
    if (Date.now() > data.expiresAt) {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
      return null;
    }

    // Refresh expiration smoothly
    data.expiresAt = Date.now() + TIMEOUT_MS;
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(data));

    return data.password;
  } catch (e) {
    return null;
  }
}

export async function saveSessionPassword(password: string): Promise<void> {
  try {
    const data: SessionData = {
      password,
      expiresAt: Date.now() + TIMEOUT_MS,
    };
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(data));
  } catch (e) {
    // safely ignore keychain errors
  }
}

export async function clearSession(): Promise<void> {
  try {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  } catch (e) {}
}
