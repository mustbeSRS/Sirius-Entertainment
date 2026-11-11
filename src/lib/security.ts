import { randomBytes, createHash } from 'node:crypto';
export const SESSION_DAYS = 30;
export const newToken = () => randomBytes(32).toString('base64url');
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export function assertOrigin(request: Request) {
 const expected = process.env.APP_ORIGIN || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');
 if (!expected || request.headers.get('origin') !== new URL(expected).origin) throw new Error('Invalid request origin');
}
