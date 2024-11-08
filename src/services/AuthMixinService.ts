import { NextFunction, Request } from 'express';
import { Model } from 'mongoose';
import HttpStatusCode from '../utils/httpStatusCode';
import ApiError from '../middlewares/error/ApiError';
import { AuthUserType } from '../types/services/authMixinService';

class AuthMixinService<T extends AuthUserType> {
  private readonly Model: Model<T>;

  constructor(Model: Model<T>) {
    this.Model = Model;
  }

  async saveSignInDetails(user: T, req: Request): Promise<void> {
    const ipinfo = req.ipinfo;
    const userAgent = req.useragent;

    if (ipinfo) {
      user?.signInDetails?.push({
        ip: ipinfo.ip,
        city: ipinfo.city,
        country: ipinfo.country,
        timezone: ipinfo.timezone,
        countryCode: ipinfo.countryCode,
        continent: {
          code: ipinfo.continent.code,
          name: ipinfo.continent.name,
        },
        version: userAgent?.version,
        os: userAgent?.os,
        platform: userAgent?.platform,
        signInDate: new Date(),
        browser: userAgent?.browser,
      });
      await user.save();
    }
  }

  handleExistingEmail = async (
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
}

export default AuthMixinService;
