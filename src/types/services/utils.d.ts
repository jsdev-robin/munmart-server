export interface EncryptedData {
  iv: string;
  encryptedData: string;
}

export interface OtpGeneratorOptions {
  expiresIn?: string | number;
  otpLength?: number;
}

export interface OtpGeneratorResult {
  token: string;
  otp: number;
}
