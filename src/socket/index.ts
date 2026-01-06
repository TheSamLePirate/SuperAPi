import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { socketAuthMiddleware } from './auth';
import { registerHandlers } from './handlers';

export const initSocket = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        path: '/socket.io', // Explicitly set path
        cors: {
            origin: '*', // Allow all for MVP, configure as needed
            methods: ['GET', 'POST'],
        },
        // Optional: enforce max buffer size here if needed
        transports: ['websocket', 'polling'] // Enforce websocket preference
    });

    io.use(socketAuthMiddleware);

    io.on('connection', (socket: Socket) => {
        const userId = (socket as any).userId;
        console.log(`User ${userId} connected (${socket.id})`);

        registerHandlers(io, socket);

        // Monitor incoming events
        socket.onAny((event, ...args) => {
            // Don't log monitor events to avoid infinite loop
            if (event.startsWith('monitor:')) return;

            io.to('admin-room').emit('monitor:socket:incoming', {
                event,
                args,
                socketId: socket.id,
                userId: userId, // from socketAuthMiddleware
                timestamp: Date.now()
            });
        });

        // Notify connection
        io.to('admin-room').emit('monitor:connection', {
            type: 'connect',
            socketId: socket.id,
            userId: userId,
            timestamp: Date.now()
        });

        socket.on('disconnect', () => {
            io.to('admin-room').emit('monitor:connection', {
                type: 'disconnect',
                socketId: socket.id,
                userId: userId,
                timestamp: Date.now()
            });
        });
    });

    return io;
};
