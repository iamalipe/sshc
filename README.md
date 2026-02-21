# zssh - SSH Chain

**zssh** is a modern, cross-platform CLI tool to manage and connect to your SSH servers with encrypted local storage and cloud sync capabilities.

## Features

- **Secure**: All configuration is encrypted using AES-256-GCM with a master password.
- **Cross-Platform**: Works on macOS, Windows, and Linux.
- **Cloud Sync**: Sync your connections across devices using GitHub Gists (Encrypted).
- **Shortcuts**: Connect to servers using short aliases or IDs.
- **Auto-Login**: Supports password auto-fill (requires `sshpass`) and private keys.

## Installation

```bash
npm install -g @abhiseck/zssh
```

## Usage

### Add a Connection

```bash
zssh add
```

Follow the interactive prompts to save your server details.

### List Connections

```bash
zssh list
```

Displays a table of all saved connections.

### Connect

```bash
zssh connect <alias_or_id>
# Example:
zssh connect my-server
```

### Remove a Connection

```bash
zssh remove <alias_or_id>
```

### Cloud Sync

To enable cloud sync, you need a GitHub Personal Access Token (PAT) with `gist` scope.

**Save to Cloud:**

```bash
zssh save
```

**Sync from Cloud:**

```bash
zssh sync
```

## Security

Your configuration is stored in `~/.zssh.json`. The entire content is encrypted. You will be prompted for your master password when running commands.

## Requirements

- Node.js >= 14
- `sshpass` (Optional, for password auto-fill)
  - macOS: `brew install sshpass`
  - Ubuntu: `apt-get install sshpass`

## License

ISC
