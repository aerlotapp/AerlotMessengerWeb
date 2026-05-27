import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_AERLOT_SUPABASE_URL as string;
const anon = import.meta.env.VITE_AERLOT_SUPABASE_ANON_KEY as string;

export const aerlotSupabase: SupabaseClient = createClient(url, anon, {
  auth: { persistSession: false },
});
