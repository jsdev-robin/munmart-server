import express from 'express';
import userAuthController from '../controllers/userAuthController';
import validationMiddleware from '../middlewares/validators/validationSchemas';
import { runSchema } from '../middlewares/validators/runSchema';
const router = express.Router();

router.post(
  '/signup',
  validationMiddleware.signupSchema,
  runSchema,
  userAuthController.signup
);

router.post(
  '/verify-email',
  validationMiddleware.activationSchema,
  runSchema,
  userAuthController.verifyAccount
);

router.post(
  '/signin',
  validationMiddleware.signinSchema,
  runSchema,
  userAuthController.signin
);

export default router;
