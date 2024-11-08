import { Schema } from 'mongoose';
import { ISignInDetail } from '../types/global';

export const signInDetailSchema = new Schema<ISignInDetail>({
  ip: String,
  city: String,
  country: String,
  timezone: String,
  countryCode: String,
  continent: {
    code: String,
    name: String,
  },
  browser: String,
  version: String,
  os: String,
  platform: String,
  signInDate: { type: Date, default: Date.now },
});
