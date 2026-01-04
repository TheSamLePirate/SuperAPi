"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = void 0;
const config_1 = require("../config");
const socketAuthMiddleware = (socket, next) => {
    const { apiKey, userId } = socket.handshake.auth;
    if (!apiKey || apiKey !== config_1.config.API_KEY) {
        return next(new Error('Unauthorized: Invalid or missing API Key'));
    }
    if (!userId) {
        return next(new Error('Unauthorized: Missing userId'));
    }
    // Attach userId to socket for later use
    socket.userId = userId;
    next();
};
exports.socketAuthMiddleware = socketAuthMiddleware;
