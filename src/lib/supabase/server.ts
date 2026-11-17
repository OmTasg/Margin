import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseUrl(): string | undefined {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
  if (process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID) {
    return `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co`;
  }
  return undefined;
}

function getSupabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY
  );
}

export const isSupabaseConfiguredServer = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    !url.includes("your-supabase-url") &&
    !key.includes("your-anon-key") &&
    !key.includes("placeholder")
  );
};

export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  const url = getSupabaseUrl() || "https://placeholder.supabase.co";
  const key = getSupabaseAnonKey() || "placeholder-anon-key";

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Handled in server components/actions
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Handled in server components/actions
        }
      },
    },
  });
};
