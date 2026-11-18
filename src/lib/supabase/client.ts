import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseUrl(): string | undefined {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
  if (process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID) {
    return `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co`;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("margin_supabase_url");
      if (stored) return stored.trim();
    } catch {}
  }
  return undefined;
}

export function getSupabaseAnonKey(): string | undefined {
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (process.env.SUPABASE_ANON_KEY) return process.env.SUPABASE_ANON_KEY;
  if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (process.env.SUPABASE_PUBLISHABLE_KEY) return process.env.SUPABASE_PUBLISHABLE_KEY;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("margin_supabase_anon_key");
      if (stored) return stored.trim();
    } catch {}
  }
  return undefined;
}

export const isSupabaseConfigured = (): boolean => {
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

export function getSupabaseConfigDetails(): {
  isConfigured: boolean;
  url: string | null;
  maskedKey: string | null;
  source: "env" | "local" | "none";
} {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const isEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
  );

  const configured = isSupabaseConfigured();
  return {
    isConfigured: configured,
    url: configured && url ? url : null,
    maskedKey:
      configured && key
        ? `${key.slice(0, 8)}...${key.slice(-4)}`
        : null,
    source: configured ? (isEnv ? "env" : "local") : "none",
  };
}

export function setCustomSupabaseCredentials(url: string, key: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("margin_supabase_url", url.trim());
  localStorage.setItem("margin_supabase_anon_key", key.trim());
  cachedClient = null;
  lastClientKey = "";
}

export function clearCustomSupabaseCredentials() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("margin_supabase_url");
  localStorage.removeItem("margin_supabase_anon_key");
  cachedClient = null;
  lastClientKey = "";
}

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;
let lastClientKey = "";

export const createClient = () => {
  const url = getSupabaseUrl() || "https://placeholder.supabase.co";
  const key = getSupabaseAnonKey() || "placeholder-anon-key";
  const cacheKey = `${url}:${key}`;

  if (cachedClient && lastClientKey === cacheKey) {
    return cachedClient;
  }

  cachedClient = createBrowserClient(url, key);
  lastClientKey = cacheKey;
  return cachedClient;
};
