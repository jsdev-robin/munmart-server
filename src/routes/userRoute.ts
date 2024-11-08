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

export default router;
