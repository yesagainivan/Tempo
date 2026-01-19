import { create } from 'zustand';
import { supabase } from '../lib/db/powersync';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
    session: Session | null;
    user: User | null;
    loading: boolean;
    initialized: boolean;

    initialize: () => Promise<void>;
    signInWithGithub: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    user: null,
    loading: true,
    initialized: false,

    initialize: async () => {
        if (get().initialized) return;

        // Check initial session
        const { data: { session } } = await supabase.auth.getSession();
        set({
            session,
            user: session?.user ?? null,
            loading: false,
            initialized: true
        });

        // Listen for changes
        supabase.auth.onAuthStateChange((_event, session) => {
            set({
                session,
                user: session?.user ?? null,
                loading: false
            });
        });
    },

    signInWithGithub: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                // Ensure we redirect back to the full URL (including /Tempo/ subpath)
                // window.location.origin only gives the domain (e.g. github.io)
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) throw error;
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null });
    }
}));
