function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function getAuthEnv() {
  return {
    ADMIN_PASSWORD: getRequiredEnv("ADMIN_PASSWORD"),
    ADMIN_SESSION_SECRET: getRequiredEnv("ADMIN_SESSION_SECRET")
  };
}

export function getSupabaseEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")
  };
}
