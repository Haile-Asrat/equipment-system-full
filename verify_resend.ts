import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Setup: Create a dummy unverified user
    const email = `test_resend_${Date.now()}@example.com`;
    const user = await prisma.user.create({
        data: {
            email,
            password: 'HASHED_PASSWORD',
            name: 'Test Resend',
            otpCode: '123456',
            emailVerified: false
        }
    });

    console.log(`Created user ${user.id} with OTP ${user.otpCode}`);

    try {
        // Try 127.0.0.1 to avoid localhost issues
        const res = await fetch('http://127.0.0.1:3000/api/auth/resend-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const text = await res.text();
        console.log('API Status:', res.status);

        try {
            const data = JSON.parse(text);
            console.log('API Response JSON:', data);

            if (res.status === 200) {
                // 3. Verify: Check DB for new OTP
                const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
                if (updatedUser?.otpCode !== '123456') {
                    console.log('SUCCESS: OTP was updated to', updatedUser?.otpCode);
                } else {
                    console.error('FAILURE: OTP was NOT updated');
                }
            } else {
                console.error('FAILURE: API returned error status');
            }
        } catch (e) {
            console.error('FAILURE: Response is not JSON. Raw body:', text.substring(0, 500));
        }

    } catch (e) {
        console.error('Fetch failed:', e);
    } finally {
        // Cleanup
        await prisma.user.delete({ where: { id: user.id } });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
