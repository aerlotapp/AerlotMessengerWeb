export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isValidOtp = (otp: string): boolean => /^\d{6}$/.test(otp.trim());
