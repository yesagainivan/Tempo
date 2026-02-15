import { PowerSyncDatabase } from '@powersync/web';
import { AppSchema } from './schema';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AbstractPowerSyncDatabase, PowerSyncBackendConnector } from '@powersync/web';

// =================================================================
// SUPABASE CLIENT
// =================================================================

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// =================================================================
// POWERSYNC CONNECTOR
// =================================================================

export class SupabaseConnector implements PowerSyncBackendConnector {
    readonly client: SupabaseClient;
    private cachedToken: string | null = null;
    private cachedUserId: string | null = null;

    constructor(client: SupabaseClient) {
        this.client = client;

        // Initialize cached token from current session
        this.client.auth.getSession().then(({ data: { session } }) => {
            this.cachedToken = session?.access_token ?? null;
            this.cachedUserId = session?.user.id ?? null;
        });

        // Subscribe to auth state changes to keep cache updated
        this.client.auth.onAuthStateChange((_event, session) => {
            this.cachedToken = session?.access_token ?? null;
            this.cachedUserId = session?.user.id ?? null;
        });
    }

    async fetchCredentials() {
        // Use cached token - no async getSession() call needed
        if (!this.cachedToken) {
            return null;
        }

        return {
            endpoint: import.meta.env.VITE_POWERSYNC_URL,
            token: this.cachedToken,
        };
    }

    // Helper to get cached user ID for uploads
    getUserId(): string | null {
        return this.cachedUserId;
    }

    async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
        const transaction = await database.getNextCrudTransaction();

        if (!transaction) {
            return;
        }

        try {
            for (const op of transaction.crud) {
                const table = op.table;
                const id = op.id;

                // Map Supabase REST API calls
                if (op.op === 'PUT') {
                    const user_id = this.getUserId();

                    // Explicitly inject user_id to ensure RLS/Not-Null constraints are satisfied
                    const data = { ...op.opData, id, user_id };

                    const { error } = await this.client.from(table).upsert(data);
                    if (error) throw error;
                } else if (op.op === 'PATCH') {
                    const { error } = await this.client.from(table).update(op.opData).eq('id', id);
                    if (error) throw error;
                } else if (op.op === 'DELETE') {
                    const { error } = await this.client.from(table).delete().eq('id', id);
                    if (error) throw error;
                }
            }

            await transaction.complete();
        } catch (ex) {
            console.error('Data upload failed', ex);
            // Verify if we should rollback or just retry later
            // For now, simpler to not complete transaction so it retries
            // await transaction.complete(); 
        }
    }
}

// =================================================================
// POWERSYNC DATABASE INSTANCE
// =================================================================

export const connector = new SupabaseConnector(supabase);

export const db = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
        dbFilename: 'tempo.db',
    },
    flags: {
        useWebWorker: false, // Disabling worker to prevent Safari crashes
    }
});

export const setupPowerSync = async () => {
    await db.init();
    // Note: db.connect() is called separately in App.tsx after auth is ready
};
