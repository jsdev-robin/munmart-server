import { Model } from 'mongoose';
import Utils from './Utils';
import { IUser } from '../types/models/userModel';
import {
  IUserSignupRequest,
  IVerifyAccountRequest,
} from '../types/services/userAuthService';
import { NextFunction, Response } from 'express';
import ApiError from '../middlewares/error/ApiError';
import HttpStatusCode from '../utils/httpStatusCode';
import EnvConfig from '../configs/envConfig';
import SendEmail from '../utils/SendEmail';
import Status from '../utils/status';

class UserAuthService<T extends IUser> extends Utils {
  private readonly Model: Model<T>;

  constructor(Model: Model<T>) {
    super();
    this.Model = Model;
  }

  signup = this.asyncHandler(
    async (
      req: IUserSignupRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const { fname, lname, email, password } = req.body;

      // Check if all required fields are provided
      if (!fname || !lname || !email || !password) {
        const error: ApiError = new ApiError(
          'First name, last name, email, and password are required.',
          HttpStatusCode.BAD_REQUEST
        );
        next(error);
        return;
      }

      // Check if the email is already registered
      const existingUser = await this.Model.findOne({ email });

      if (existingUser) {
        const error: ApiError = new ApiError(
          'This email address is already registered. Please use a different email.',
          HttpStatusCode.BAD_REQUEST
        );
        next(error);
        return;
      }

      // Prepare the user object with encrypted password
      const newUser = {
        fname,
        lname,
        email,
        password: this.encryptData(password, EnvConfig.CRYPTO_SECRET),
      };

      // Generate OTP and token for account verification
      const verificationDetails = this.generateSecureOtp(
        newUser,
        EnvConfig.ACTIVATION_SECRET
      );
      if (!verificationDetails) {
        next(
          new ApiError(
            'Uh-oh! Something went sideways. Try again soon!',
            HttpStatusCode.INTERNAL_SERVER_ERROR
          )
        );
        return;
      }

      const { token, otp } = verificationDetails;

      // Prepare the email content with OTP for the user
      const emailContent = {
        user: {
          name: this.capitalizeText(newUser.fname),
          email: newUser.email,
        },
        otp,
      };

      // Send the verification email
      await new SendEmail(emailContent)
        .verifyAccount()
        .then(() => {
          res.status(HttpStatusCode.OK).json({
            status: Status.SUCCESS,
            message:
              'Verification code sent successfully to your email address.',
            token,
          });
        })
        .catch(() => {
          const error = new ApiError(
            'An error occurred while sending the verification email. Please try again later.',
            HttpStatusCode.INTERNAL_SERVER_ERROR
          );
          next(error);
        });
    }
  );

  verifyAccount = this.asyncHandler(
    async (
      req: IVerifyAccountRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {}
  );
}

export default UserAuthService;
