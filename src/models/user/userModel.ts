import { Schema, model, Model } from 'mongoose';
import { compare, hash } from 'bcryptjs';
import { IUser } from '../../types/models/userModel';
import { signInDetailSchema } from '../globalModel';
import { AddressSchema, CardSchema, PurchaseSchema } from './particlesModel';
import Utils from '../../services/Utils';
import EnvConfig from '../../configs/envConfig';

const userSchema = new Schema<IUser>(
  {
    fname: {
      type: String,
      trim: true,
    },
    lname: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    phoneNumber: {
      type: String,
      select: false,
    },
    password: {
      type: String,
      select: false,
    },
    dateOfBirth: {
      type: Date,
      select: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
      select: false,
    },
    accountStatus: {
      type: {
        banned: {
          isBanned: {
            type: Boolean,
            default: false,
          },
          bannedReason: {
            type: String,
            default: '',
          },
          bannedAt: { type: Date, default: Date.now },
        },
        disabled: {
          isAccountDisabled: {
            type: Boolean,
            default: false,
          },
          disabledReason: {
            type: String,
            default: '',
          },
          disabledAt: { type: Date, default: Date.now },
        },
      },
      default: {
        banned: { isBanned: false, bannedReason: '', bannedAt: Date.now() },
        disabled: {
          isAccountDisabled: false,
          disabledReason: '',
          disabledAt: Date.now(),
        },
      },
      select: false,
    },
    loginIp: {
      type: {
        first: {
          type: String,
          default: '',
          select: false,
        },
        last: {
          type: String,
          default: '',
          select: false,
        },
      },
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
      select: false,
    },
    isSocial: {
      type: Boolean,
      default: false,
      select: false,
    },
    signInDetails: {
      type: [signInDetailSchema],
      select: false,
    },
    addresses: {
      type: [AddressSchema],
      select: false,
    },
    cards: {
      type: [CardSchema],
      select: false,
    },
    purchases: {
      type: [PurchaseSchema],
      select: false,
    },
    recentlyViewed: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    orderHistory: [
      {
        orderId: {
          type: Schema.Types.ObjectId,
          ref: 'Order',
        },
        date: Date,
        status: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ isVerified: 1 });
userSchema.index({ banned: 1 });
userSchema.index({ disabled: 1 });
userSchema.index({ isSocial: 1 });
userSchema.index({
  'accountStatus.banned.isBanned': 1,
  'accountStatus.disabled.isAccountDisabled': 1,
});
userSchema.index({ 'orderHistory.status': 1 });

// Virtual field to get the user's full name by combining first name and last name
userSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.fname ?? ''} ${this.lname ?? ''}`.trim();
});

// Pre-save hook to hash the user's password before saving if it's modified
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) {
      next();
      return;
    }

    const hashedPassword: any = await hash(this.password ?? '', 12);
    this.password = hashedPassword;

    next();
  } catch (error: any) {
    next(error as Error);
  }
});

// Method to compare provided password with the hashed password in the database
userSchema.methods.correctPassword = async function (
  this: IUser,
  providedPassword: string
): Promise<boolean> {
  return await compare(providedPassword, this.password ?? '');
};

// Updated methods for accountStatus object structure
userSchema.methods.disableAccount = async function (
  this: IUser,
  reason: string
): Promise<IUser> {
  this.accountStatus = this.accountStatus ?? {
    banned: { isBanned: false, bannedReason: '' },
    disabled: { isAccountDisabled: false, disabledReason: '' },
  };

  this.accountStatus.disabled = this.accountStatus.disabled ?? {
    isAccountDisabled: false,
    disabledReason: '',
  };

  this.accountStatus.disabled.isAccountDisabled = true;
  this.accountStatus.disabled.disabledReason = reason;
  return await this.save();
};

userSchema.methods.enableAccount = async function (
  this: IUser
): Promise<IUser> {
  this.accountStatus = this.accountStatus ?? {
    banned: { isBanned: false, bannedReason: '' },
    disabled: { isAccountDisabled: false, disabledReason: '' },
  };

  this.accountStatus.disabled = this.accountStatus.disabled ?? {
    isAccountDisabled: false,
    disabledReason: '',
  };

  this.accountStatus.disabled.isAccountDisabled = false;
  this.accountStatus.disabled.disabledReason = '';
  return await this.save();
};

userSchema.methods.banAccount = async function (
  this: IUser,
  reason: string
): Promise<IUser> {
  this.accountStatus = this.accountStatus ?? {
    banned: { isBanned: false, bannedReason: '' },
    disabled: { isAccountDisabled: false, disabledReason: '' },
  };

  this.accountStatus.banned = this.accountStatus.banned ?? {
    isBanned: false,
    bannedReason: '',
  };

  this.accountStatus.banned.isBanned = true;
  this.accountStatus.banned.bannedReason = reason;
  return await this.save();
};

userSchema.methods.unbanAccount = async function (this: IUser): Promise<IUser> {
  this.accountStatus = this.accountStatus ?? {
    banned: { isBanned: false, bannedReason: '' },
    disabled: { isAccountDisabled: false, disabledReason: '' },
  };

  this.accountStatus.banned = this.accountStatus.banned ?? {
    isBanned: false,
    bannedReason: '',
  };

  this.accountStatus.banned.isBanned = false;
  this.accountStatus.banned.bannedReason = '';
  return await this.save();
};

// Update login IP address method
userSchema.methods.updateLoginIp = async function (
  this: IUser,
  ipAddress: string
): Promise<IUser> {
  if (!this.loginIp) {
    this.loginIp = { firstLoginIp: '', lastLoginIp: '' };
  }

  if (!this.loginIp.firstLoginIp) {
    this.loginIp.firstLoginIp = ipAddress;
  }
  this.loginIp.lastLoginIp = ipAddress;

  return await this.save();
};

// Ensure sensitive information is entirely removed from the output.
userSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret.password;
    delete ret.phoneNumber;
    delete ret.twoFactorEnabled;
    delete ret.signInDetails;
    delete ret.addresses;
    delete ret.cards;
    delete ret.purchases;
  },
});

// Generates a signed access token for the user.
userSchema.methods.signAccessToken = function (this: IUser) {
  return Utils.signJwt(
    { id: this._id },
    EnvConfig.ACCESS_TOKEN ?? '',
    EnvConfig.ACCESS_TOKEN_EXPIRE ?? '5m'
  );
};

const User: Model<IUser> = model<IUser>('User', userSchema);
export default User;
