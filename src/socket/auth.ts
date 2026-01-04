import { Socket } from 'socket.io';
import { config } from '../config';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    const { apiKey, userId } = socket.handshake.auth;

    if (!apiKey || apiKey !== config.API_KEY) {
        return next(new Error('Unauthorized: Invalid or missing API Key'));
    }

    if (!userId) {
        return next(new Error('Unauthorized: Missing userId'));
    }

    // Attach userId to socket for later use
    (socket as any).userId = userId;

    next();
};
