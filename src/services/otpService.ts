import { aerlotSupabase } from "@/config/supabase";

export const requestOtp = async (email: string) => {
  const { data, error } = await aerlotSupabase.auth.signInWithOtp({
    email,
  });
  if (error) throw error;
  return data;
};

export const confirmOtp = async (email: string, otp: string) => {
  const { data, error } = await aerlotSupabase.auth.verifyOtp({
    email,
    token: otp,
    type: "email",
  });
  if (error) throw error;
  return data;
};
