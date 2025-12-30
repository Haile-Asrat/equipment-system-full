import prisma from './prisma';
import { encrypt } from './crypto';

export async function writeLog(userId: number | null, action: string, ipAddress?: string) {
  try {
    const payload = encrypt(action);
    const encryptedIp = ipAddress ? encrypt(ipAddress) : undefined;
    await prisma.log.create({
      data: {
        userId: userId || undefined,
        action: payload,
        ipAddress: encryptedIp
      }
    });
  } catch (e) {
    console.error('log error', e);
  }
}
