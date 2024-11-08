import { Types, Document } from 'mongoose';
import { avatar, ISignInDetail } from '../global';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ICard {
  cardNumber: string;
  cardHolderName: string;
  expirationDate: string;
  billingAddress: IAddress;
}

export interface IPurchase {
  itemId: string;
  itemName: string;
  purchaseDate: Date;
  price: number;
  quantity: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  fname: string;
  lname: string;
  email: string;
  bio: string;
  avatar: avatar;
  role: string;
  phoneNumber?: string;
  password?: string;
  dateOfBirth?: Date;
  twoFactorEnabled?: boolean;
  accountStatus?: {
    banned?: {
      isBanned?: boolean;
      bannedReason?: string;
    };
    disabled?: {
      isAccountDisabled?: boolean;
      disabledReason?: string;
    };
  };
  loginIp?: {
    firstLoginIp?: string;
    lastLoginIp?: string;
  };
  isVerified?: boolean;
  isSocial?: boolean;
  signInDetails?: ISignInDetail[];
  addresses?: IAddress[];
  cards?: ICard[];
  purchases?: IPurchase[];
  recentlyViewed: Types.ObjectId[];
  wishlist: Types.ObjectId[];
  orderHistory: OrderHistory[];

  signAccessToken: () => string;
  correctPassword: (candidatePassword: string) => Promise<boolean>;
}
