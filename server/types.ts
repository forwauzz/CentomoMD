import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

declare module 'express' {
  interface Request {
    session: any;
  }
}

// Authenticated request with guaranteed session data  
export interface AuthenticatedRequest extends Express.Request {
  session: {
    userId: string;
    userRole?: string;
  } & import('express-session').SessionData;
}