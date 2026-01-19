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

    constructor(client: SupabaseClient) {
        this.client = client;
    }

    async fetchCredentials() {
        const { data: { session }, error } = await this.client.auth.getSession();

        if (!session || error) {
            return null;
        }

        return {
            endpoint: import.meta.env.VITE_POWERSYNC_URL,
            token: session.access_token,
        };
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
                console.log(`[PowerSync] Uploading ${op.op} to ${table}: ${id}`, op.opData);

                // Map Supabase REST API calls
                if (op.op === 'PUT') {
                    const session = await this.client.auth.getSession();
                    const user_id = session.data.session?.user.id;

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
            console.log('[PowerSync] Transaction completed successfully');
        } catch (ex: any) {
            console.error('[PowerSync] Data upload failed', JSON.stringify(ex, null, 2));
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
});

export const setupPowerSync = async () => {
    await db.init();
    await db.connect(connector);
};
