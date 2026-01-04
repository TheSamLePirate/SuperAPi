import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { socketAuthMiddleware } from './auth';
import { registerHandlers } from './handlers';

export const initSocket = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: '*', // Allow all for MVP, configure as needed
            methods: ['GET', 'POST'],
        },
        // Optional: enforce max buffer size here if needed
    });

    io.use(socketAuthMiddleware);

    io.on('connection', (socket: Socket) => {
        const userId = (socket as any).userId;
        console.log(`User ${userId} connected (${socket.id})`);

        registerHandlers(io, socket);
    });

    return io;
};
