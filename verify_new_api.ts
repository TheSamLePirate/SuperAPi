import { io } from 'socket.io-client';
import axios from 'axios';

const PORT = 3000;
const URL = `http://localhost:${PORT}`;
const API_KEY = 'dev-secret-key-123';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
    try {
        console.log('--- Starting New API Verification ---');

        console.log('1. Testing Memory API...');
        const testData = { foo: 'bar', timestamp: Date.now() };

        // SET
        console.log('   POST /memory/test-key');
        await axios.post(`${URL}/memory/test-key`, testData, {
            headers: { 'x-api-key': API_KEY }
        });

        // GET
        console.log('   GET /memory/test-key');
        const getRes = await axios.get(`${URL}/memory/test-key`, {
            headers: { 'x-api-key': API_KEY }
        });

        if (JSON.stringify(getRes.data) !== JSON.stringify(testData)) {
            console.error('Expected:', testData);
            console.error('Got:', getRes.data);
            throw new Error('Memory verification failed: Data mismatch');
        }
        console.log('✅ Memory API passed');

        console.log('2. Testing Socket API...');
        // Create Room
        try {
            await axios.post(`${URL}/v1/rooms`, { roomId: 'api-test-room', createdBy: 'tester' }, {
                headers: { 'x-api-key': API_KEY }
            });
        } catch (e: any) {
            if (e.response?.status !== 409) throw e;
        }

        // Connect Client
        console.log('   Connecting Socket Client...');
        const client = io(URL, {
            path: '/socket.io',
            transports: ['websocket'],
            auth: { apiKey: API_KEY, userId: 'api-tester' }
        });

        await new Promise<void>((resolve, reject) => {
            client.on('connect', resolve);
            setTimeout(() => reject(new Error('Connect timeout')), 2000);
        });

        // Join Room
        console.log('   Joining Room...');
        await new Promise<void>((resolve, reject) => {
            client.emit('room:join', { roomId: 'api-test-room' }, (res: any) => {
                if (res.error) reject(new Error(res.error));
                else resolve();
            });
        });

        // Listen for Event
        const eventPromise = new Promise<void>((resolve, reject) => {
            client.on('custom-event', (payload: any) => {
                console.log('   Received event payload:', payload);
                if (payload.msg === 'hello from api') resolve();
                else reject(new Error('Wrong payload'));
            });
            setTimeout(() => reject(new Error('Event timeout')), 3000);
        });

        // Send Event via HTTP
        console.log('   POST /toSocket/custom-event');
        await axios.post(`${URL}/toSocket/custom-event`, {
            roomId: 'api-test-room',
            payload: { msg: 'hello from api' }
        }, {
            headers: { 'x-api-key': API_KEY }
        });

        await eventPromise;
        console.log('✅ Socket API passed');

        client.disconnect();
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
