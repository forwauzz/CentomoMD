/**
 * Security middleware for CentomoMD API endpoints
 * Implements rate limiting, input validation, and security headers
 */

import rateLimit from "express-rate-limit";

/**
 * Rate limiter for audio transcription endpoints
 * Prevents abuse while allowing legitimate medical transcription usage
 */
export const audioLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 30, // 30 chunks per minute per IP (reasonable for 30-second chunks)
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: "RATE_LIMIT_EXCEEDED", 
    message: "Too many transcription requests. Please wait before trying again." 
  },
  skip: (req) => {
    // Skip rate limiting for authenticated admin users in development
    return process.env.NODE_ENV === 'development' && req.session?.user?.role === 'admin';
  }
});

/**
 * Rate limiter for general API endpoints
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: "RATE_LIMIT_EXCEEDED", 
    message: "Too many requests. Please slow down." 
  }
});

/**
 * Strict rate limiter for sensitive endpoints (auth, user management)
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: "RATE_LIMIT_EXCEEDED", 
    message: "Too many attempts. Please wait before trying again." 
  }
});

/**
 * Audio file validation middleware
 */
export const validateAudioFile = (req: any, res: any, next: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "NO_FILE", message: "Audio file is required" });
  }
  
  // Check file size (max 25MB for audio files)
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (req.file.size > maxSize) {
    return res.status(400).json({ 
      error: "FILE_TOO_LARGE", 
      message: `File size exceeds ${maxSize / 1024 / 1024}MB limit` 
    });
  }
  
  // Check MIME type
  const allowedTypes = [
    'audio/webm',
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/mp4',
    'audio/m4a',
    'audio/aac',
    'audio/ogg',
    'audio/flac'
  ];
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ 
      error: "UNSUPPORTED_AUDIO_TYPE", 
      message: `Unsupported audio format: ${req.file.mimetype}` 
    });
  }
  
  next();
};

/**
 * Security headers configuration
 */
export const securityHeaders = {
  contentSecurityPolicy: false, // Disable CSP for Vite dev server compatibility
  crossOriginEmbedderPolicy: false, // Allow cross-origin requests for API
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true
};

/**
 * Request sanitization for logging (removes sensitive data)
 */
export const sanitizeForLogging = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'session'];
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
};