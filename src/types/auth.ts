export interface AuthUser {
  email: string;
}

export interface OtpSendResult {
  token: string;
  expiresAt: number;
}
