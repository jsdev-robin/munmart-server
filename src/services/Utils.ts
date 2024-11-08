import { RequestHandler, Request, Response, NextFunction } from 'express';
import crypto, { createCipheriv, createDecipheriv } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import EnvConfig from '../configs/envConfig';
import { EncryptedData } from '../types/services/utils';
import { ObjectId } from 'mongoose';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // Defined constant for key length
const IV_LENGTH = 16; // Defined constant for IV length

class Utils {
  /**
   * Ensures the provided encryption key is exactly 32 bytes in length.
   * Pads or truncates the key as necessary.
   * @param key - The encryption key as a string.
   * @returns A 32-byte Buffer.
   */
  private padKey(key: string): Buffer {
    const keyBuffer = Buffer.from(key, 'utf-8');
    if (keyBuffer.length < KEY_LENGTH) {
      const paddedKey = Buffer.alloc(KEY_LENGTH);
      keyBuffer.copy(paddedKey);
      return paddedKey;
    }
    return keyBuffer.slice(0, KEY_LENGTH);
  }

  /**
   * Wraps an async function to catch errors and pass them to Express error handlers.
   * @param fn - The async function to wrap.
   * @returns A RequestHandler that automatically catches errors.
   */
  protected asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
      fn(req, res, next).catch(next);
    };
  };

  /**
   * Encrypts the given text using AES-256-CBC encryption with the provided key.
   * @param text - The text or object to encrypt.
   * @param key - The encryption key as a string.
   * @returns An object containing the initialization vector and encrypted data.
   */
  protected encryptData = (text: any, key: string): EncryptedData => {
    try {
      const iv = Buffer.from(EnvConfig.BYTE_KEY_16, 'utf-8').slice(
        0,
        IV_LENGTH
      );
      const cipher = createCipheriv(ALGORITHM, this.padKey(key), iv);
      let encrypted = cipher.update(JSON.stringify(text), 'utf-8', 'hex');
      encrypted += cipher.final('hex');
      return { iv: iv.toString('hex'), encryptedData: encrypted };
    } catch (error: any) {
      throw new Error(`Encryption failed during encryptData: ${error.message}`);
    }
  };

  /**
   * Decrypts the given encrypted data using AES-256-CBC encryption with the provided key.
   * @param encryptedData - The object containing the initialization vector and encrypted data.
   * @param key - The encryption key as a string.
   * @returns The decrypted text or object.
   */
  protected decryptData = (encryptedData: EncryptedData, key: string): any => {
    try {
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = createDecipheriv(ALGORITHM, this.padKey(key), iv);
      let decrypted = decipher.update(
        encryptedData.encryptedData,
        'hex',
        'utf-8'
      );
      decrypted += decipher.final('utf-8');
      return JSON.parse(decrypted);
    } catch (error: any) {
      throw new Error(`Decryption failed during decryptData: ${error.message}`);
    }
  };

  /**
   * Capitalizes the first letter of a given string.
   * @param text - The text to capitalize.
   * @returns The capitalized string.
   */
  protected capitalizeText = (text: string): string => {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  };

  /**
   * Converts data into a Redis key string.
   * @param key - The data to convert (could be a string, buffer, number, ObjectId, etc.).
   * @returns The string representation of the key.
   */
  protected keyToString = (
    key: string | Buffer | number | undefined | ObjectId | any
  ): string => {
    const validId: string = key?.toString() ?? '';
    return validId;
  };

  /**
   * Verifies a JWT token and returns the payload.
   * @param token - The JWT token to verify.
   * @param secret - The secret key used to verify the token.
   * @returns The decoded payload if valid.
   */
  static decodeJwt = (token: string, secret: string): JwtPayload | string => {
    return jwt.verify(token, secret);
  };

  /**
   * Creates a new JWT token with a given payload, secret, and expiration time.
   * @param payload - The payload to encode in the JWT token.
   * @param secret - The secret key used to sign the token.
   * @param expiresIn - The expiration time for the token (default is 1 hour).
   * @returns The signed JWT token.
   */
  static signJwt = (
    payload: JwtPayload,
    secret: string,
    expiresIn: string = '1h'
  ): string => {
    return jwt.sign(payload, secret, { expiresIn });
  };

  /**
   * Generates a one-time password (OTP) and returns a JWT token with the OTP encrypted.
   * @param payload - The payload to encode in the JWT token.
   * @param secret - The secret key used to sign the token.
   * @param options - Optional settings for OTP generation.
   * @param options.expiresIn - The expiration time for the token (default is 10 minutes).
   * @param options.otpLength - The length of the OTP (default is 6 digits).
   * @returns The generated JWT token and OTP value.
   */
  protected generateSecureOtp = (
    payload: object,
    secret: string,
    options: { expiresIn?: string; otpLength?: number } = {}
  ): { token: string; otp: number } => {
    const { expiresIn = '3m', otpLength = 6 } = options;

    if (otpLength < 6 || otpLength > 10) {
      throw new Error('OTP length must be between 6 and 10 digits.');
    }

    const otpMin = Math.pow(10, otpLength - 1);
    const otpMax = Math.pow(10, otpLength) - 1;

    const otp = crypto.randomInt(otpMin, otpMax);
    const encryptedOtp = this.encryptData(otp, EnvConfig.CRYPTO_SECRET);

    const token = jwt.sign({ payload, encryptedOtp }, secret, {
      expiresIn,
    });

    return { token, otp };
  };
}

export default Utils;
