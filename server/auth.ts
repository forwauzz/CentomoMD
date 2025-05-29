import bcrypt from 'bcryptjs';
import session from 'express-session';
import { randomBytes } from 'crypto';
import connectPgSimple from 'connect-pg-simple';

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate user ID
export function generateUserId(): string {
  return randomBytes(16).toString('hex');
}

// Session configuration
export function getSessionConfig() {
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(64).toString('hex');
  
  // Use database session store for production
  const PgSession = connectPgSimple(session);
  
  const sessionConfig: any = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Allow cookies over HTTP
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  };

  // Use PostgreSQL session store if database is available
  if (process.env.DATABASE_URL) {
    sessionConfig.store = new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions',
      createTableIfMissing: true,
    });
  }
  
  return session(sessionConfig);
}

// Authentication middleware
export function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

// Admin middleware
export function requireAdmin(req: any, res: any, next: any) {
  if (!req.session?.userId || req.session?.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}