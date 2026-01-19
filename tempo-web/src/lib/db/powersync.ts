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

                // Map Supabase REST API calls
                // Note: We use the table name directly
                if (op.op === 'PUT') {
                    const data = { ...op.opData, id };
                    await this.client.from(table).upsert(data);
                } else if (op.op === 'PATCH') {
                    await this.client.from(table).update(op.opData).eq('id', id);
                } else if (op.op === 'DELETE') {
                    await this.client.from(table).delete().eq('id', id);
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
});

export const setupPowerSync = async () => {
    await db.init();
    await db.connect(connector);
};
