# Privacy & Data Ownership Guide

## Data Architecture
*   **User Device**: Holds a local copy of data (SQLite).
*   **Supabase (Cloud)**: Holds the "Master" copy of all data (Postgres).
*   **PowerSync**: The "Pipe" syncing the two.

## Admin Access ("Super Access")
**Yes, you have access.**
As the owner of the Supabase project, you can log into the Supabase Dashboard and view the `tasks` table. You will see every task created by every user.
*   **Is this normal?** Yes. This is how 99% of web apps work (Twitter, Notion, Todoist, etc.). Engineers at those companies technically *can* access the database, but legal policies and access controls prevent abuse.
*   **Is this a privacy concern?** It depends on your promise to users.
    *   **Standard Trust**: Users trust you not to snoop.
    *   **Zero Knowledge**: The alternative is "End-to-End Encryption" (E2EE), where data is encrypted *before* leaving the device. Supabase would only see gibberish. This is much harder to build but possible for the future.

## Security (RLS)
We enabled **Row Level Security (RLS)** in Supabase.
*   **What it does**: Prevents `User A` from fetching `User B`'s tasks via the API.
*   **What it doesn't do**: Hide data from *you* (the database administrator).

## Checklist for Sharing
1.  **Terms of Service / Privacy Policy**: If you launch publicly, you usually need a page stating "We store your data on Supabase servers in [Region]..."
2.  **Backups**: Enable Point-in-Time Recovery (PITR) in Supabase if data is critical.
3.  **GitHub limits**: GitHub Pages is free but public (source code is visible if repo is public).
