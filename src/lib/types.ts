export interface SSHConnection {
  id: string;
  alias: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKeyPath?: string;
  description?: string;
  createdAt: string;
}

export interface Config {
  connections: SSHConnection[];
  gistId?: string;
  githubToken?: string;
}
