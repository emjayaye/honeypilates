import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Pulled from app.config.js / .env via Expo Constants.extra.
// Fail loud at boot so we don't silently ship a broken auth flow.
const supabaseUrl =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Don't throw — let the app render so dev can see the message.
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Auth + DB will not work until these are set in .env'
  );
}

// SSR-safe storage adapter.
//
// Expo Router renders pages server-side on web (Node), where `window`
// and `localStorage` don't exist. AsyncStorage's web shim references
// `window.localStorage` directly and crashes at module-load time
// inside SSR. We side-step that by:
//
//   • Server (web SSR): return a no-op storage so Supabase loads but
//     finds no session — the real session restore happens on the
//     client after hydration.
//   • Client (browser): use window.localStorage directly. Skips the
//     legacy AsyncStorage web shim entirely.
//   • Native (iOS / Android): use AsyncStorage — it's the right
//     primitive there and there's no SSR concern.
const noopStorage = {
  getItem: async (_k: string) => null,
  setItem: async (_k: string, _v: string) => {},
  removeItem: async (_k: string) => {},
};
const webStorage = {
  getItem: async (k: string) => {
    try { return globalThis.localStorage?.getItem(k) ?? null; }
    catch { return null; }
  },
  setItem: async (k: string, v: string) => {
    try { globalThis.localStorage?.setItem(k, v); } catch {}
  },
  removeItem: async (k: string) => {
    try { globalThis.localStorage?.removeItem(k); } catch {}
  },
};
const storage =
  Platform.OS === 'web'
    ? (typeof window !== 'undefined' ? webStorage : noopStorage)
    : AsyncStorage;

// No-op cross-tab lock. Supabase auth-js defaults to navigator.locks
// which has hung on us during web hydration. Honey Pilates is single-
// user-per-tab; we don't need cross-tab coordination for token refresh.
const noLock = async (_name: string, _timeout: number, fn: () => Promise<any>) => fn();

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: noLock,
    },
  },
);
