import User from '../models/user/userModel';
import UserAuthService from '../services/UserAuthService';
import { IUser } from '../types/models/userModel';

const userAuthController = new UserAuthService<IUser>(User);

export default userAuthController;
