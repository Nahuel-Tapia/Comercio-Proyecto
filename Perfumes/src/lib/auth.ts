import crypto from 'crypto';

// The secret should come from env, but we fallback for development
const SECRET = import.meta.env?.JWT_SECRET || 'fallback-secret-ledo-desir-2024';

/**
 * Hashes a password using scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verifies a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  if (!hash || !hash.includes(':')) return false;
  const [salt, key] = hash.split(':');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return key === derivedKey;
}

/**
 * Signs a session string to prevent tampering
 */
export function signSession(sessionId: string): string {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(sessionId);
  return `${sessionId}.${hmac.digest('hex')}`;
}

/**
 * Verifies a signed session string and returns the sessionId if valid
 */
export function verifySession(signedSession: string): string | null {
  if (!signedSession || !signedSession.includes('.')) return null;
  const [sessionId, signature] = signedSession.split('.');
  
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(sessionId);
  const expectedSignature = hmac.digest('hex');
  
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return sessionId;
  }
  return null;
}
