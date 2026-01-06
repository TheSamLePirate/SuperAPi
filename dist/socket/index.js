"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const auth_1 = require("./auth");
const handlers_1 = require("./handlers");
const initSocket = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        path: '/socket.io', // Explicitly set path
        cors: {
            origin: '*', // Allow all for MVP, configure as needed
            methods: ['GET', 'POST'],
        },
        // Optional: enforce max buffer size here if needed
        transports: ['websocket', 'polling'] // Enforce websocket preference
    });
    io.use(auth_1.socketAuthMiddleware);
    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`User ${userId} connected (${socket.id})`);
        (0, handlers_1.registerHandlers)(io, socket);
        // Monitor incoming events
        socket.onAny((event, ...args) => {
            // Don't log monitor events to avoid infinite loop
            if (event.startsWith('monitor:'))
                return;
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
exports.initSocket = initSocket;
