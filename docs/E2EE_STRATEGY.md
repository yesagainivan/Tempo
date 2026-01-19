# Tempo End-to-End Encryption (E2EE) Strategy

> [!IMPORTANT]
> **Executive Summary**
> Tempo's Local-First architecture puts it in a unique position to offer **"Signal-grade" privacy** with **"Notion-grade" features**. Unlike server-first apps that must choose between privacy and features, Tempo can have both by leveraging the client device for search and data processing.
>
> We recommend adopting a **Zero-Knowledge Architecture** immediately. This aligns with Tempo's core value of "Solid foundations first" and avoids painful migrations later.

## 1. The Core Concept: "The Vault"

In standard apps, the server is the "Brain". In Tempo, the User's Device is the "Brain", and the Server is just a "Sync Relay".

### Architecture at a Glance

| Component | Role | Knowledge Level |
| :--- | :--- | :--- |
| **Tempo Client** | Encrypts data, Decrypts data, Indexes data for search. | **Full Access** (Plaintext) |
| **PowerSync** | Syncs opaque binary blobs between devices. | **Zero Knowledge** (Ciphertext) |
| **Supabase** | Persists encrypted blobs. | **Zero Knowledge** (Ciphertext) |

## 2. Technical Implementation

### A. The Data Model (Transport Layer)
We treat our synced database tables as a **Transport Layer**. Real data lives inside encrypted fields.

**Current Schema:**
```typescript
interface Task {
  id: string;
  title: string;
  content: string;
}
```

**E2EE Schema:**
```typescript
interface Task {
  id: string;
  // Metadata (Unencrypted for routing/sync logic)
  created_at: string;
  updated_at: string;
  
  // The Payload (Encrypted)
  // Contains JSON: { title: "...", content: "..." }
  encrypted_data: string; // Base64 encoded ciphertext
  iv: string; // Initialization Vector for AES-GCM
  key_id: string; // Rotated key identifier
}
```

### B. The Search Problem (and Solution)
**Challenge:** You cannot fuzzy-search `U2FsdGVkX1...`.
**Solution:** **"Client-Side Decryption & Local Indexing"**

Because Tempo is Local-First, we have the entire dataset on the device.
1.  **Sync:** PowerSync downloads the *Encrypted* rows.
2.  **Decrypt:** The app decrypts rows in memory or on-the-fly.
3.  **Index:** We maintain a **Local-Only (Non-Synced)** FTS Table in SQLite.

```sql
-- This table NEVER leaves the device
CREATE TABLE local_search_index (
  task_id TEXT PRIMARY KEY,
  title_plaintext TEXT,
  content_plaintext TEXT
);
```
**Search Flow:**
1.  User types "Project Alpha".
2.  App queries `local_search_index` (Plaintext SQL query).
3.  App gets `task_ids`.
4.  App renders the actual React components using the decrypted data store.

### C. Key Management (The "Golden Key")
This is the hardest part of E2EE. If a user loses their key, their data is gone forever.

**The Key Hierarchy:**
1.  **Transport Key (Data Key):** A random AES-256 key that encrypts the actual data.
2.  **Master Key (KEK):** Encrypts the Data Key. Derived from the user's secret.

**Recovery Strategy:**
Since we cannot verify effective password strength, we **MUST** generate a **Recovery Code** (e.g., a 24-word Mnemonics phrase or a `tempo-recovery-code.txt`) during signup.
-   **Login:** User enters Email + Password -> Server authenticates -> Local App tries to decrypt the Master Key.
-   **Forgot Password:** User must input the Recovery Code to regenerate the Master Key. **Server cannot reset it.**

## 3. Implementation Plan

We recommend a 4-Phase rollout to adhere to "Solid Foundations First".

### Phase 1: The Cryptography Layer
-   Implement `src/lib/crypto.ts` using **Web Crypto API** (Native, Fast, Secure).
-   Create the `KeyManager` class to handle generation, storage (IndexedDB), and wrapping.
-   **Goal:** Can encrypt/decrypt string <-> string reliably in tests.

### Phase 2: Dual-Write Schema
-   Modify Supabase Schema to add `encrypted_data` columns, but keep plaintext columns for now.
-   Update App to write to *both* (Plaintext + Encrypted).
-   **Goal:** Verify data flows correctly without breaking the current app.

### Phase 3: The Switch (Read Path)
-   Implement the "Local Search Index".
-   Update React Components to read from the Decrypted layer, not directly from PowerSync.
-   **Goal:** App works 100% using the encrypted path, but plaintext still exists as backup.

### Phase 4: The Purge
-   Drop plaintext columns from Supabase.
-   **Goal:** True Zero-Knowledge.

## 4. Why this is the "Tempo Way"

This approach creates a **Premium** product.
-   **Trust:** "Your thoughts are mathematically yours."
-   **Quality:** We don't rely on server latency for search or operations.
-   **Architecture:** It forces a clean separation between "Data Sync" and "Data Logic".

## Recommendation

**Proceed with E2EE.**
The engineering cost regarding `Search` is negated by our specific Local-First choice. The main cost is **Key Management UI** (Recovery Codes, etc), which is a worthy investment for a tool designed for "Deep Work" and second brains.
