import { Model } from 'mongoose';
import Utils from './Utils';
import { IUser } from '../types/models/userModel';
import {
  IUserSigninRequest,
  IUserSignupRequest,
  IVerifyAccountRequest,
} from '../types/services/userAuthService';
import { NextFunction, Request, Response } from 'express';
import ApiError from '../middlewares/error/ApiError';
import HttpStatusCode from '../utils/httpStatusCode';
import EnvConfig from '../configs/envConfig';
import SendEmail from '../utils/SendEmail';
import Status from '../utils/status';
import { EncryptedData } from '../types/services/utils';
import { commonOptions } from '../utils/cookieOptions';
import redisClient from '../configs/ioredis';

class UserAuthService<T extends IUser> extends Utils {
  private readonly Model: Model<T>;

  constructor(Model: Model<T>) {
    super();
    this.Model = Model;
  }

  private readonly handleExistingEmail = async (
    email: string,
    next: NextFunction
  ): Promise<boolean> => {
    const existingUser = await this.Model.findOne({ email });
    if (existingUser) {
      next(
        new ApiError(
          'This email is already registered. Use a different email address.',
          HttpStatusCode.BAD_REQUEST
        )
      );
      return true;
    }
    return false;
  };

  async sessionToken(
    req: Request,
    res: Response,
    next: NextFunction,
    statusCode: number,
    user: T,
    rememberMe: boolean | undefined,
    redirectURL?: string
  ): Promise<void> {
    // Ensure the user's password and account status are not included in the response.
    if (user) {
      user.password = undefined;
      user.accountStatus = undefined;
    }
    // Generate an access and  a refresh for the authenticated user.
    const accessToken = user?.signAccessToken();
    if (!accessToken) {
      const error = new ApiError(
        "Oops! It looks like we're having a hiccup. Give it another go, or reach out if it's still acting up!",
        HttpStatusCode.FORBIDDEN
      );
      next(error);
      return;
    }

    // Define cookie options based on the rememberMe parameter
    const cookieOptions = rememberMe
      ? {
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          maxAge: 7 * 24 * 60 * 60 * 1000,
          ...commonOptions,
        }
      : {
          ...commonOptions,
        }; // Session cookie (expires on browser close)

    // Set cookie for access token
    res.cookie('user_access_token', accessToken, cookieOptions);

    // Store user session data in Redis if rememberMe is true
    if (rememberMe) {
      await redisClient.set(this.keyToString(user?._id), JSON.stringify(user));
    }

    if (redirectURL) {
      res.redirect(redirectURL);
    } else {
      res.status(statusCode).json({
        status: Status.SUCCESS,
        message: `Welcome back ${user.fname}.`,
        user,
        accessToken,
      });
    }
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
      if (await this.handleExistingEmail(email, next)) return;

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
    ): Promise<void> => {
      const { activationToken, otp } = req.body;

      // Ensure OTP is provided
      if (!otp) {
        next(
          new ApiError(
            'Please enter the verification code we sent to complete your activation.',
            HttpStatusCode.BAD_REQUEST
          )
        );
        return;
      }

      // Ensure activation token is provided
      if (!activationToken) {
        next(
          new ApiError(
            'Activation token is missing. Please try again or request a new code.',
            HttpStatusCode.BAD_REQUEST
          )
        );
        return;
      }

      // Decode and verify activation token
      const decoded = Utils.decodeJwt(
        activationToken,
        EnvConfig.ACTIVATION_SECRET
      ) as {
        payload: {
          fname: string;
          lname: string;
          email: string;
          password: EncryptedData;
        };
        encryptedOtp: EncryptedData;
      };

      // Ensure token is valid
      if (!decoded) {
        next(
          new ApiError(
            'Your activation code has expired or is invalid. Please try again.',
            HttpStatusCode.BAD_REQUEST
          )
        );
        return;
      }

      // Check that provided OTP matches the decoded OTP
      const encryptedOtp = this.decryptData(
        decoded.encryptedOtp,
        EnvConfig.CRYPTO_SECRET
      );
      const decodedOTP = +encryptedOtp;
      const providedOTP = +otp;

      if (decodedOTP !== providedOTP) {
        next(
          new ApiError(
            'The OTP you entered is incorrect. Please check it and try again.',
            HttpStatusCode.BAD_REQUEST
          )
        );
        return;
      }

      // Extract user details from the decoded payload
      const { fname, lname, email, password } = decoded.payload;

      // Verify email is not already registered
      if (await this.handleExistingEmail(email, next)) return;

      // Create a new user with verified status
      const newUser = await this.Model.create({
        fname: this.capitalizeText(fname),
        lname: this.capitalizeText(lname),
        email,
        password: this.decryptData(password, EnvConfig.CRYPTO_SECRET),
        isVerified: true,
      });

      // Send success response
      res.status(HttpStatusCode.CREATED).json({
        status: Status.SUCCESS,
        newUser,
        message: `Success, ${this.capitalizeText(
          fname
        )}! Your account is now activated.`,
      });
    }
  );

  signin = this.asyncHandler(
    async (
      req: IUserSigninRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const { email, password, rememberMe } = req.body;

      // Check if email and password are provided
      if (!email || !password) {
        const error: ApiError = new ApiError(
          'Please provide your email and password.',
          HttpStatusCode.BAD_REQUEST
        );
        next(error);
        return;
      }

      // Find user by email
      const user = await this.Model.findOne({ email }).select(
        '+password +accountStatus'
      );

      if (!user) {
        const error: ApiError = new ApiError(
          'Incorrect email or password. Please check your credentials and try again.',
          HttpStatusCode.UNAUTHORIZED
        );
        next(error);
        return;
      }

      // Check if the account is banned
      if (user?.accountStatus?.banned?.isBanned) {
        const error: ApiError = new ApiError(
          user?.accountStatus.banned.bannedReason ?? 'Your account is banned.',
          HttpStatusCode.FORBIDDEN
        );
        next(error);
        return;
      }

      // Check if the account is disabled
      if (user?.accountStatus?.disabled?.isAccountDisabled) {
        const error: ApiError = new ApiError(
          'Your account is disabled. Please reach out to our support team for assistance.',
          HttpStatusCode.FORBIDDEN
        );
        next(error);
        return;
      }

      // Check if provided password is correct
      const isPasswordCorrect = await user.correctPassword(password);

      if (!isPasswordCorrect) {
        const error: ApiError = new ApiError(
          'Incorrect email or password. Please check your credentials and try again.',
          HttpStatusCode.UNAUTHORIZED
        );
        next(error);
        return;
      }

      await this.sessionToken(
        req,
        res,
        next,
        HttpStatusCode.OK,
        user,
        rememberMe
      );
    }
  );
}

export default UserAuthService;
