import jwt from 'jsonwebtoken';
export async function verifyToken(token?: string) {
  if (!token) return null;
  try {
    const data = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'secret') as any;
    return { id: data.id, email: data.email, role: data.role, clearance: data.clearance };
  } catch (e) { return null; }
}
export function signToken(payload: any) {
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET || 'secret', { expiresIn: '8h' });
}
