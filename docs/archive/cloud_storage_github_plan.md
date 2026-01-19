# Implementation Plan - Cloud Storage (GitHub)

## Goal
Enable users to sync their Tempo tasks and settings to a private GitHub repository they own. This ensures:
1.  **Data Ownership**: Users own their data in standard formats (Markdown/JSON).
2.  **Portability**: Data is accessible via other tools (Obsidian, VS Code).
3.  **Backup**: Robust version history provided freely by Git.

## Architecture Decisions

### 1. Authentication: GitHub App
We will use a **GitHub App** instead of a standard OAuth App.
*   **Why**:
    *   **Granularity**: Can restricted access to *only* the specific `tempo-data` repository, rather than all private repos.
    *   **Security**: Short-lived user-access tokens (optional), cleaner permission model.
    *   **UX**: "Install Tempo Cloud on [Select Repository]" is a clear user flow.

### 2. The "Gatekeeper" (Auth Service)
To keep the Client Secret secure, we cannot do the full OAuth handshake in the browser.
*   **Solution**: A minimal **Cloudflare Worker** (or Vercel Function) acts as the token exchanger.
*   **Flow**:
    1.  Client redirects user to GitHub App Install URL.
    2.  GitHub redirects back to `tempo.app/callback?code=...`
    3.  Client sends `code` to `auth-worker.tempo.app/exchange`.
    4.  Worker uses `CLIENT_SECRET` to swap code for `access_token`.
    5.  Worker returns `access_token` to Client.
    6.  Client stores token in `IndexedDB` (securely).

### 3. Sync Strategy: "Smart REST"
Instead of running a full Git binary in the browser (`isomorphic-git` is heavy), we will use the **GitHub REST API** (specifically the Git Data API for Trees/Commits).

*   **Data Model**:
    *   `/tasks/{uuid}.md`: Task content + Frontmatter metadata.
    *   `/settings.json`: Global app settings.

*   **Sync Logic (Client-Side `SyncEngine`)**:
    *   **Pull**: Check `HEAD` commit SHA. If changed, fetch changed files since last known SHA. Update local Dexie DB.
    *   **Push**:
        *   Listen to Dexie `creating`/`updating`/`deleting` hooks.
        *   Debounce changes (e.g., 5 seconds).
        *   Create a "Tree" of changed files.
        *   Create a "Commit" pointing to the new Tree.
        *   Update reference (`heads/main`) to point to new Commit.

## User Review Required
> [!IMPORTANT]
> **Hosting the Auth Worker**:
> To make this "Production Ready", we need a place to check the OAuth code.
> *   **Option A**: I can provide the code for a Cloudflare Worker that you deploy on your own account (Free tier is plenty).
> *   **Option B**: For development/testing, we can run a local mock server, but eventually, this Component MUST be hosted publicly for GitHub to callback to.
>
> **Self-Hosting decision**: Are you comfortable deploying a simple worker script?

## Proposed Changes

### Cloud Architecture
#### [NEW] `auth-worker/`
*   Stand-alone directory for the Cloudflare Worker code.
*   `src/index.ts`: The token exchange logic.

### Frontend (`tempo-web`)
#### [NEW] `src/lib/cloud/`
*   `github.ts`: Typed wrapper around GitHub API (Octokit or lighter fetch wrapper).
*   `sync-engine.ts`: The core logic class.
    *   `startSync()`: Initializes listeners.
    *   `pushChanges()`: Batches local changes to commit.
    *   `pullChanges()`: Ingests remote changes to Dexie.
*   `types.ts`: API response types.

#### [MODIFY] `src/lib/db/index.ts`
*   Add hooks to the Dexie instance to trigger the SyncEngine.
    *   `db.tasks.hook('creating', ...)`
    *   `db.tasks.hook('updating', ...)`
    *   `db.tasks.hook('deleting', ...)`

#### [NEW] `src/components/settings/GitHubConnect.tsx`
*   UI component to initiate the flow ("Connect GitHub").
*   Shows sync status (Last synced: 2m ago).

## Verification Plan

### Manual Verification
1.  **Auth Flow**: Click "Connect", approve in GitHub, receive Token.
2.  **Initial Push**: Create a task in Tempo -> Verify `.md` file appears in GitHub Repo.
3.  **Round-trip**: Edit `.md` file in GitHub Web UI -> Verify change appears in Tempo.
4.  **Offline**: Make changes offline -> Reconnect -> Verify sync occurs.
