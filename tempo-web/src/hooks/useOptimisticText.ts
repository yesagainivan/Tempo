import { useState, useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';

interface UseOptimisticTextReturn {
    value: string;
    setValue: (val: string) => void;
    isSaving: boolean;
}

/**
 * Manages text input state that is backed by a remote async store (database),
 * providing optimistic updates and "echo cancellation" to prevent
 * remote syncs from overwriting local typing.
 *
 * @param remoteValue The value coming from the remote source (props)
 * @param onSave Async callback to persist the value
 * @param debounceMs Delay in ms before triggering onSave
 */
export function useOptimisticText(
    remoteValue: string,
    onSave: (val: string) => Promise<void>,
    debounceMs: number = 500
): UseOptimisticTextReturn {
    // Local state for immediate UI feedback
    const [value, setValue] = useState(remoteValue);

    // Track saving state
    const [isSaving, setIsSaving] = useState(false);

    // Keep track of the last value we successfully sent to onSave
    // This allows us to ignore "echoes" where the remote confirms what we just sent.
    const lastSavedValue = useRef<string | null>(null);

    // Debounce the local value for saving
    const debouncedValue = useDebounce(value, debounceMs);

    // Effect: Handle remote updates (incoming props)
    useEffect(() => {
        // If the new remote value matches what we *just* saved,
        // it's an "echo" confirming our save. Ignore it to prevent cursor/input jumps.
        if (remoteValue === lastSavedValue.current) {
            return;
        }

        // If it's a genuine remote change (or we haven't saved anything yet),
        // sync our local state to it.
        // NOTE: This follows "Last Write Wins". If remote changes while we have unsaved
        // local changes, we technically overwrite local work here if we wanted strictly
        // remote-wins, but for a single-user LWW flow, this usually means "syncing up".
        // However, standard React pattern usually blows away local state on prop change
        // unless we are very careful.
        // 
        // Refinement: If user is actively typing, debouncedValue might differ from value.
        // But here we are checking remoteValue.
        // If remoteValue !== localValue, we update.
        // The echo cancellation protects us from the standard "save -> sync -> prop update" loop.
        setValue(remoteValue);
    }, [remoteValue]);

    // Effect: Trigger save on debounced value change
    useEffect(() => {
        // Don't save if it's the initial load (matches remote)
        // or if we just synced from remote.
        //
        // Logic:
        // We only save if debouncedValue is different from what we last saved
        // AND consistent with current intention.

        // Skip first run or no-op updates
        // We can't easily detect "first run" without a ref, relying on lastSavedValue

        const save = async () => {
            // Determine if we need to save
            if (debouncedValue === lastSavedValue.current) return;
            // Also check if it matches current remote to avoid redundant saves on load
            // (though checking lastSavedValue usually covers this if initialized right)

            // Edge case: Initial load. lastSavedValue is null.
            // debouncedValue equals remoteValue (via initial useState).
            // We shouldn't save.
            if (lastSavedValue.current === null && debouncedValue === remoteValue) {
                lastSavedValue.current = remoteValue; // Sync ref so we don't save later
                return;
            }

            setIsSaving(true);
            try {
                lastSavedValue.current = debouncedValue;
                await onSave(debouncedValue);
            } catch (error) {
                console.error('Auto-save failed:', error);
                // Optionally handle error state here
            } finally {
                setIsSaving(false);
            }
        };

        save();
    }, [debouncedValue, onSave, remoteValue]);

    return {
        value,
        setValue,
        isSaving
    };
}
