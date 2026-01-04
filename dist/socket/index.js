"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const auth_1 = require("./auth");
const handlers_1 = require("./handlers");
const initSocket = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*', // Allow all for MVP, configure as needed
            methods: ['GET', 'POST'],
        },
        // Optional: enforce max buffer size here if needed
    });
    io.use(auth_1.socketAuthMiddleware);
    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`User ${userId} connected (${socket.id})`);
        (0, handlers_1.registerHandlers)(io, socket);
    });
    return io;
};
exports.initSocket = initSocket;
