import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// AsyncStorage is not available during SSR (server-side rendering on web).
// Use a no-op storage fallback when window is not defined.
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

async function getStorage() {
  if (isServer) return noopStorage;
  const { default: AsyncStorage } = await import(
    '@react-native-async-storage/async-storage'
  );
  return AsyncStorage;
}

let storageResolved: any = isServer ? noopStorage : undefined;
getStorage().then(s => { storageResolved = s; });

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key: string) => storageResolved?.getItem(key) ?? Promise.resolve(null),
      setItem: (key: string, value: string) => storageResolved?.setItem(key, value) ?? Promise.resolve(),
      removeItem: (key: string) => storageResolved?.removeItem(key) ?? Promise.resolve(),
    },
    autoRefreshToken: true,
    persistSession: !isServer,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
