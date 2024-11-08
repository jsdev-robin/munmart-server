import { Request } from 'express';

export interface IUserSignupRequest extends Request {
  body: {
    fname: string;
    lname: string;
    email: string;
    password: string;
  };
}

export interface IVerifyAccountRequest extends Request {
  body: {
    activationToken: string;
    otp: string;
  };
}
