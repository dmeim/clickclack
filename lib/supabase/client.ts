"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are missing. Double-check your .env.local file."
  );
}

export const getSupabaseBrowserClient = () => {
  if (!browserClient) {
    browserClient = createClient(
      supabaseUrl ?? "",
      supabaseAnonKey ?? "",
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
      }
    );
  }

  return browserClient;
};
