import prisma from './prisma';

export async function createAlert(
    type: string,
    severity: string,
    message: string,
    userId?: number,
    ipAddress?: string
) {
    try {
        await prisma.alert.create({
            data: {
                type,
                severity,
                message,
                userId,
                ipAddress,
            },
        });
    } catch (error) {
        console.error('Failed to create alert:', error);
    }
}

export async function createFailedLoginAlert(userId: number, ipAddress: string, attemptCount: number) {
    const severity = attemptCount >= 4 ? 'High' : 'Medium';
    const message = `Failed login attempt #${attemptCount} from IP ${ipAddress}`;
    await createAlert('FailedLogin', severity, message, userId, ipAddress);
}

export async function createLockoutAlert(userId: number, ipAddress: string) {
    const message = `Account locked due to multiple failed login attempts from IP ${ipAddress}`;
    await createAlert('AccountLockout', 'Critical', message, userId, ipAddress);
}

export async function createUnauthorizedAccessAlert(userId: number, resource: string, ipAddress: string) {
    const message = `Unauthorized access attempt to ${resource} from IP ${ipAddress}`;
    await createAlert('UnauthorizedAccess', 'High', message, userId, ipAddress);
}

export async function createSuspiciousActivityAlert(userId: number, activity: string, ipAddress: string) {
    const message = `Suspicious activity detected: ${activity} from IP ${ipAddress}`;
    await createAlert('SuspiciousActivity', 'Medium', message, userId, ipAddress);
}
