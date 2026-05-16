import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// AuthContext exposes the current Supabase session + a loading flag
// so screens can render auth UI vs. signed-in UI without polling.
// supabase.auth.onAuthStateChange keeps the session fresh across
// sign-in, sign-out, token refresh, and the initial restore from
// AsyncStorage on cold start.
//
// Safety: getSession() can hang on web if the underlying lock /
// storage misbehaves. We race it against a 4s timeout so the app
// always escapes the loading state, even if Supabase is sick.
type AuthState = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, loading: true });

const SESSION_TIMEOUT_MS = 4000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Race getSession() against a timeout — if Supabase hangs we
    // still drop into the unauthed UI so the user can act.
    const restore = async () => {
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((resolve) =>
            setTimeout(() => {
              // eslint-disable-next-line no-console
              console.warn('[auth] getSession() timed out — falling back to signed-out state');
              resolve({ data: { session: null } });
            }, SESSION_TIMEOUT_MS),
          ),
        ]);
        if (!mounted) return;
        setSession(result.data.session);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[auth] getSession() threw:', e);
        if (mounted) setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    restore();

    // Subscribe to all subsequent auth state changes (sign-in /
    // sign-out / token refresh / user updated). This fires immediately
    // on subscription with the current session, so the listener also
    // covers the restore path on most platforms.
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      // eslint-disable-next-line no-console
      console.log('[auth] state change:', event, next?.user?.email ?? 'no user');
      setSession(next);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
