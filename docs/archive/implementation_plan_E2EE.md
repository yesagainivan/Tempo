# Implementation Plan - End-to-End Encryption (E2EE)

## Goal
Secure all user data (Tasks, Notes) using client-side encryption. The server (Supabase/PowerSync) will store only encrypted blobs. We will implement a "Vault" architecture where a random 256-bit encryption key protects the data, and this key is unlocked by the user's password.

## User Review Required
> [!IMPORTANT]
> **Breaking Change:** This requires a database migration. We need to create a `vaults` table in Supabase.
> **Data Loss Risk:** If the user forgets their password, data is irrecoverable. We must implement a Recovery Key flow (future step, but foundation now).

## Proposed Changes

### 1. Database Schema (Supabase & [schema.ts](file:///Users/ivanowono/Documents/Code/Rusty/Apps/tempo/tempo-web/src/lib/db/schema.ts))
#### [NEW] `vaults` Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Owner)
- `encrypted_key` (Text/Blob, The vault key encrypted by user's derived key)
- `salt` (Text, Salt for PBKDF2 key derivation)
- `ops_limit`, `mem_limit` (Int, Argon2 parameters if using Argon2, or PBKDF2 params)

#### [MODIFY] `tasks` Table
- Add `encrypted_title` (Text)
- Add `encrypted_content` (Text)
- Mark `title` and `content` as deprecated/null for E2EE users.

### 2. Crypto Primitives (`src/lib/crypto/`)
#### [NEW] `crypto.ts`
- `generateKey()`: Returns random 32-byte key.
- `deriveKey(password, salt)`: PBKDF2-SHA256 (or Argon2id if WASM available) to turn password into Key Wrapping Key (KWK).
- `encrypt(text, key)`: AES-GCM-256 encryption. Returns `{ iv, ciphertext, tag }`.
- `decrypt(ciphertext, key)`: AES-GCM-256 decryption.

### 3. Vault Service (`src/lib/auth/VaultService.ts`)
- `createVault(password)`: Generates Vault Key, wraps it, updates Auth Store.
- `unlockVault(password)`: Retrieves `encrypted_key` from DB, unwraps it.
- `getVaultKey()`: Returns the active Vault Key (memory only).

### 4. Integration
- Update [useTasks](file:///Users/ivanowono/Documents/Code/Rusty/Apps/tempo/tempo-web/src/hooks/useTasks.ts#131-181) and [TaskItem](file:///Users/ivanowono/Documents/Code/Rusty/Apps/tempo/tempo-web/src/components/tasks/TaskItem.tsx#15-18) to decrypt data on the fly (or hydrate into a memory cache).
- *Optimization:* Decrypt on fetch vs decrypt on render. A "DecryptedTask" mapping layer is preferred.

## Verification Plan

### Manual Verification
1.  **Vault Creation:** Sign up -> Create Master Password -> Check `vaults` table in Supabase (should see blobs).
2.  **Task Creation:** Create task "Secret Plans" -> Check `tasks` table (should see garbage).
3.  **Relogin:** Logout -> Login -> Enter Password -> Task "Secret Plans" appears readable.
