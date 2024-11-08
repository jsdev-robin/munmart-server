// src/@types/express-ipinfo.d.ts

import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    ipinfo?: {
      ip: string;
      city: string;
      region: string;
      country: string;
      loc: string;
      postal: string;
      timezone: string;
      [key: string]: any; // Allow for other properties as needed
    };
  }
}
