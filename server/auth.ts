import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { UserRole } from '../src/types';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: UserRole;
  fundId: string;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const CISO_JWT_SECRET = process.env.CISO_JWT_SECRET || 'silver-scout-production-zero-trust-secret-key-32ch';

/**
 * Enterprise CISO Security Headers Middleware
 */
export function applySecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;"
  );
  next();
}

/**
 * Base64URL encoding / decoding helpers for RFC 7519 compliant JWTs
 */
function base64urlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(input: string): string {
  let str = input.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4 !== 0) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

/**
 * Cryptographically generates an HMAC-SHA256 signed JWT
 */
export function generateSignedJWT(
  user: Omit<AuthenticatedUser, 'email'> & { email?: string; exp?: number },
  secret: string = CISO_JWT_SECRET
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: AuthenticatedUser = {
    uid: user.uid,
    role: user.role,
    fundId: user.fundId,
    email: user.email || `${user.uid}@${user.fundId}.com`,
    exp: user.exp || Math.floor(Date.now() / 1000) + 86400 // default 24h
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest();
  const encodedSignature = base64urlEncode(signature);

  return `${signatureInput}.${encodedSignature}`;
}

/**
 * Cryptographically verifies an HMAC-SHA256 signed JWT
 * Rejects unsigned, forged, tampered, or expired tokens
 */
export function verifySignedJWT(token: string, secret: string = CISO_JWT_SECRET): AuthenticatedUser {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT structure: Expected header.payload.signature');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest();
  const expectedEncodedSig = base64urlEncode(expectedSignature);

  // Constant-time comparison to prevent timing attacks
  const providedBuffer = Buffer.from(encodedSignature);
  const expectedBuffer = Buffer.from(expectedEncodedSig);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid cryptographic signature: Token has been forged or tampered with');
  }

  const decodedJson = base64urlDecode(encodedPayload);
  const payload: AuthenticatedUser = JSON.parse(decodedJson);

  // Validate standard claims
  if (!payload.uid || !payload.role || !payload.fundId) {
    throw new Error('Token payload missing mandatory claims (uid, role, fundId)');
  }

  // Enforce expiration
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token has expired');
  }

  return payload;
}

/**
 * Zero-Trust Multi-Tenant Authentication Middleware
 * Enforces cryptographic signature verification and tenant boundary isolation.
 */
export function authenticateTenant(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const requestedFundId = req.params.fundId;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing or malformed Authorization Bearer header'
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Empty authorization token'
    });
    return;
  }

  try {
    const decoded = verifySignedJWT(token);

    // Zero-Trust Tenant Boundary Check: Users cannot cross fund boundaries unless global admin
    if (requestedFundId && decoded.fundId !== requestedFundId && decoded.role !== 'admin') {
      res.status(403).json({
        error: 'TENANT_ACCESS_DENIED',
        message: `Caller from fund '${decoded.fundId}' cannot access resources in fund '${requestedFundId}'`
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Failed to authenticate caller token',
      details: err.message
    });
  }
}

/**
 * Role-Based Access Control (RBAC) Guard Middleware
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Role '${req.user.role}' is not authorized. Required one of: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}
