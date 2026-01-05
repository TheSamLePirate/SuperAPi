import { io } from 'socket.io-client';
import axios from 'axios';

const PORT = 3000;
const URL = `http://localhost:${PORT}`;
const API_KEY = 'dev-secret-key-123';

async function main() {
    try {
        console.log('--- Starting PeerJS Signaling Verification ---');

        console.log('1. Checking PeerServer endpoint...');
        // PeerJS server returns 404 on root typically or json info, but let's check if it accepts connection
        // We can just check healthz again to ensure server is up
        const health = await axios.get(`${URL}/healthz`);
        if (!health.data.ok) throw new Error('Health check failed');
        console.log('✅ Server is up');

        // Check if /peerjs route is mounted (usually returns some json or 404 but handled by library)
        // We will rely on socket signaling verification.

        console.log('2. Connecting Socket Clients with Peer IDs...');
        const clientA = io(URL, {
            auth: { apiKey: API_KEY, userId: 'userA' }
        });

        const clientB = io(URL, {
            auth: { apiKey: API_KEY, userId: 'userB' }
        });

        await new Promise<void>((resolve, reject) => {
            let connected = 0;
            const check = () => {
                connected++;
                if (connected === 2) resolve();
            };
            clientA.on('connect', check);
            clientB.on('connect', check);
            clientA.on('connect_error', reject);
            clientB.on('connect_error', reject);
            setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });
        console.log('✅ Clients connected');

        console.log('3. UserA creates room...');
        const roomId = await new Promise<string>((resolve, reject) => {
            clientA.emit('room:create', { roomId: 'peer-room' }, (res: any) => {
                if (res.error) reject(new Error(res.error));
                else resolve(res.roomId);
            });
        });
        console.log(`✅ Room created: ${roomId}`);

        console.log('4. UserB joins room with PeerID...');
        const peerIdB = 'peer-id-user-b';

        // Promise to catch presence on A
        const presencePromise = new Promise<void>((resolve, reject) => {
            clientA.on('room:presence', (data: any) => {
                if (data.userId === 'userB' && data.event === 'join') {
                    if (data.peerId === peerIdB) {
                        console.log('✅ UserA received correct PeerID for UserB');
                        resolve();
                    } else {
                        reject(new Error(`Wrong PeerID received: ${data.peerId}`));
                    }
                }
            });
        });

        clientB.emit('room:join', { roomId, peerId: peerIdB }, (res: any) => {
            if (res.error) throw new Error(res.error);
        });

        await presencePromise;
        console.log('✅ PeerJS Signaling Verified');
        process.exit(0);

    } catch (err: any) {
        console.error('❌ Verification Failed:', err.message);
        process.exit(1);
    }
}

main();
