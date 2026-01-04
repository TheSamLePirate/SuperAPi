import { io } from 'socket.io-client';
import axios from 'axios';

const PORT = 3000;
const URL = `http://192.168.1.111:${PORT}`;
const API_KEY = 'dev-secret-key-123';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
    try {
        console.log('--- Starting Verification ---');

        console.log('1. Testing HTTP /healthz...');
        const health = await axios.get(`${URL}/healthz`);
        if (!health.data.ok) throw new Error('Health check failed');
        console.log('✅ Health check passed');

        console.log('2. Testing HTTP POST /v1/rooms (Admin)...');
        try {
            const roomRes = await axios.post(`${URL}/v1/rooms`, {
                roomId: 'admin-room',
                createdBy: 'admin-user'
            }, {
                headers: { 'x-api-key': API_KEY }
            });
            if (roomRes.data.roomId !== 'admin-room') throw new Error('Room creation failed');
            console.log('✅ Admin room creation passed');
        } catch (e: any) {
            console.error('Room creation failed:', e.response?.data || e.message);
            throw e;
        }

        console.log('3. Connecting Socket Clients...');
        const clientA = io(URL, {
            auth: { apiKey: API_KEY, userId: 'userA' },
            transports: ['websocket']
        });

        const clientB = io(URL, {
            auth: { apiKey: API_KEY, userId: 'userB' },
            transports: ['websocket']
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

        console.log('4. UserA creates room...');
        const roomId = await new Promise<string>((resolve, reject) => {
            clientA.emit('room:create', { roomId: 'chat-room' }, (res: any) => {
                if (res.error) reject(new Error(res.error));
                else resolve(res.roomId);
            });
        });
        console.log(`✅ Room created: ${roomId}`);

        console.log('5. UserB joins room...');
        await new Promise<void>((resolve, reject) => {
            clientB.emit('room:join', { roomId }, (res: any) => {
                if (res.error) reject(new Error(res.error));
                else {
                    if (res.role === 'member') resolve();
                    else reject(new Error(`Unexpected role: ${res.role}`));
                }
            });
        });
        console.log('✅ UserB joined');

        console.log('6. Testing Messaging...');
        const messagePromise = new Promise<void>((resolve, reject) => {
            clientB.on('chat-event', (msg: any) => {
                if (msg.payload.text === 'Hello B!') {
                    console.log('✅ UserB received message:', msg);
                    resolve();
                } else {
                    reject(new Error('Received wrong message'));
                }
            });
        });

        clientA.emit('room:emit', {
            roomId,
            event: 'chat-event',
            payload: { text: 'Hello B!' }
        }, (ack: any) => {
            if (!ack.ok) throw new Error('Emit ack failed');
        });

        await messagePromise;

        console.log('--- Verification Success ---');
        process.exit(0);

    } catch (err: any) {
        console.error('❌ Verification Failed:', err.message);
        if (axios.isAxiosError(err)) {
            console.error('Response:', err.response?.data);
        }
        process.exit(1);
    }
}

main();
