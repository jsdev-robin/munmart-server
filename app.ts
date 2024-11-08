import express, { Application, NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import useragent from 'express-useragent';
import ipinfo, { defaultIPSelector } from 'ipinfo-express';

import ApiError from './src/middlewares/error/ApiError';
import HttpStatusCode from './src/utils/httpStatusCode';
import globalErrorHandler from './src/middlewares/error/globalError';
import EnvConfig from './src/configs/envConfig';

import userRouter from './src/routes/userRoute';

const app: Application = express();

// Set security-related HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Configure Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Get user device info
app.use(useragent.express());

// Get req  location
app.use(
  ipinfo({
    token: 'ea91071c3300bc',
    cache: null,
    timeout: 5000,
    ipSelector: defaultIPSelector,
  })
);

// Proxy middleware
app.set('trust proxy', 1);

// Serving static files
app.use(express.static(path.join(__dirname, './src/views')));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Parse request bodies
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Parse cookies
app.use(cookieParser());

// Apply rate limiting middleware to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (request: Request, response: Response, next: NextFunction) => {
    next(
      new ApiError(
        `Too many requests, please try again later.`,
        HttpStatusCode.TOO_MANY_REQUESTS
      )
    );
  },
});
app.use(limiter);

// Session management with a secure store
app.use(
  session({
    secret: EnvConfig.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: EnvConfig.ISPRODUCTION,
      sameSite: 'none',
    },
  })
);

// Serve JSDocs with authentication
app.use('/jsdoc', express.static(path.resolve(__dirname, 'jsdoc')));

// Testing api
app.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    status: true,
    message: 'Api working well!',
  });
});

// Global route
app.use('/api/v1/user', userRouter);

// Handle 404 errors
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(
    new ApiError(
      `Can't find ${req.originalUrl} on this server!`,
      HttpStatusCode.NOT_FOUND
    )
  );
});

// Global error handling middleware
app.use(globalErrorHandler);

// Export the app
export default app;
