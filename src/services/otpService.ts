import { sendOtp, verifyOtp } from "@/lib/otp.functions";

export const requestOtp = (email: string) => sendOtp({ data: { email } });
export const confirmOtp = (email: string, otp: string, token: string) =>
  verifyOtp({ data: { email, otp, token } });
