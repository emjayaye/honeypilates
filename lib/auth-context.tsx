import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// AuthContext exposes the current Supabase session AND the signed-in
// member's role so admin-gated UI (top-nav admin link, /admin route)
// can render without re-querying on every screen.
//
// Role is fetched once after a session resolves, then refreshed
// whenever onAuthStateChange fires SIGNED_IN. Falls back to null
// on signed-out / failed fetch.
type Role = 'member' | 'instructor' | 'admin' | null;

type AuthState = {
  session: Session | null;
  role: Role;
  isAdmin: boolean;
  isInstructorOrAdmin: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  session: null,
  role: null,
  isAdmin: false,
  isInstructorOrAdmin: false,
  loading: true,
});

const SESSION_TIMEOUT_MS = 4000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  // Fetch role for a given user id. Quiet on error — admin gates
  // simply close if we can't read the row.
  const refreshRole = async (userId: string | undefined | null) => {
    if (!userId) { setRole(null); return; }
    try {
      const { data, error } = await supabase
        .from('members')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.warn('[auth] role fetch failed:', error);
        setRole(null);
      } else {
        setRole((data?.role as Role) ?? 'member');
      }
    } catch (e) {
      console.warn('[auth] role fetch threw:', e);
      setRole(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((resolve) =>
            setTimeout(() => {
              console.warn('[auth] getSession() timed out — falling back to signed-out state');
              resolve({ data: { session: null } });
            }, SESSION_TIMEOUT_MS),
          ),
        ]);
        if (!mounted) return;
        const s = result.data.session;
        setSession(s);
        await refreshRole(s?.user.id);
      } catch (e) {
        console.error('[auth] getSession() threw:', e);
        if (mounted) { setSession(null); setRole(null); }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    restore();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, next) => {
      console.log('[auth] state change:', event, next?.user?.email ?? 'no user');
      setSession(next);
      setLoading(false);
      if (next?.user.id) await refreshRole(next.user.id);
      else setRole(null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = role === 'admin';
  const isInstructorOrAdmin = role === 'admin' || role === 'instructor';

  return (
    <AuthContext.Provider value={{ session, role, isAdmin, isInstructorOrAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
