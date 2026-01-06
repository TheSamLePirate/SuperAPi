"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitorRequestMiddleware = exports.apiKeyMiddleware = void 0;
const config_1 = require("../config");
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== config_1.config.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    }
    next();
};
exports.apiKeyMiddleware = apiKeyMiddleware;
const monitorRequestMiddleware = (req, res, next) => {
    const start = Date.now();
    // Capture response to log status code
    const originalJson = res.json;
    const originalSend = res.send;
    res.on('finish', () => {
        const duration = Date.now() - start;
        const io = req.app.get('io');
        if (io) {
            io.to('admin-room').emit('monitor:api:request', {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration,
                body: req.body,
                query: req.query,
                timestamp: Date.now()
            });
        }
    });
    next();
};
exports.monitorRequestMiddleware = monitorRequestMiddleware;
