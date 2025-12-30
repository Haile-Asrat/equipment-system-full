// @ts-ignore
// const fetch = require('node-fetch'); // Native fetch in Node 18+

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const BASE_URL = 'http://127.0.0.1:3000';
const prisma = new PrismaClient();

async function run() {
    console.log('--- Starting Permission Verification ---');

    // Ensure unique emails
    const ts = Date.now();
    const ownerEmail = `owner${ts}@test.com`;
    const editorEmail = `editor${ts}@test.com`;
    const strangerEmail = `stranger${ts}@test.com`;
    const password = 'password123';

    // Create users directly
    const hashed = await bcrypt.hash(password, 10);

    const owner = await prisma.user.create({ data: { name: 'Owner', email: ownerEmail, password: hashed, role: 'manager', emailVerified: true } });
    const editor = await prisma.user.create({ data: { name: 'Editor', email: editorEmail, password: hashed, role: 'employee', emailVerified: true } });
    const stranger = await prisma.user.create({ data: { name: 'Stranger', email: strangerEmail, password: hashed, role: 'employee', emailVerified: true } });

    // Login to get tokens
    const getToken = async (email: string) => {
        const res = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(`Login failed for ${email}: ${data.error}`);
        return data.token;
    };

    const ownerToken = await getToken(ownerEmail);
    const editorToken = await getToken(editorEmail);
    const strangerToken = await getToken(strangerEmail);

    console.log('Users created and logged in.');

    // 1. Owner creates equipment
    const createRes = await fetch(`${BASE_URL}/api/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: ownerToken, name: 'Shared Item', description: 'Test', quantity: 1, sensitivity: 'Low' })
    });
    const item = await createRes.json();
    console.log('Create Response:', JSON.stringify(item, null, 2));

    if (!createRes.ok || !item.id) {
        throw new Error(`Failed to create equipment: ${item.error || 'Unknown error'}`);
    }
    console.log('Equipment created:', item.id);

    // 2. Grant Editor CAN_EDIT
    await fetch(`${BASE_URL}/api/equipment/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: ownerToken, equipmentId: item.id, userId: editor.id, canEdit: true, canDelete: false })
    });
    console.log('Permission granted: Editor CAN EDIT');

    // 3. Editor tries to Edit (Should Success)
    const editRes = await fetch(`${BASE_URL}/api/equipment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: editorToken, id: item.id, name: 'Edited by Editor', quantity: 1, sensitivity: 'Low' })
    });
    console.log('Editor update result:', editRes.status); // 200
    if (editRes.status !== 200) throw new Error('Editor SHOULD be able to edit');

    // 4. Stranger tries to Edit (Should Fail)
    const strangerRes = await fetch(`${BASE_URL}/api/equipment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: strangerToken, id: item.id, name: 'Hacked', quantity: 1, sensitivity: 'Low' })
    });
    console.log('Stranger update result:', strangerRes.status); // 403
    if (strangerRes.status !== 403) throw new Error('Stranger should NOT be able to edit');

    // 5. Editor tries to Delete (Should Fail)
    const delRes1 = await fetch(`${BASE_URL}/api/equipment`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: editorToken, equipmentId: item.id })
    });
    console.log('Editor delete (no perm) result:', delRes1.status); // 403
    if (delRes1.status !== 403) throw new Error('Editor should NOT be able to delete yet');

    // 6. Grant Editor CAN_DELETE
    await fetch(`${BASE_URL}/api/equipment/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: ownerToken, equipmentId: item.id, userId: editor.id, canEdit: true, canDelete: true })
    });
    console.log('Permission granted: Editor CAN DELETE');

    // 7. Editor tries to Delete (Should Success)
    const delRes2 = await fetch(`${BASE_URL}/api/equipment`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: editorToken, equipmentId: item.id })
    });
    console.log('Editor delete (with perm) result:', delRes2.status); // 200
    if (!delRes2.ok) throw new Error('Editor SHOULD be able to delete');

    console.log('SUCCESS: All permission checks passed.');
}

run().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
