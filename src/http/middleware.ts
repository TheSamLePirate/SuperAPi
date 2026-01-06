import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== config.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    }

    next();
};

export const monitorRequestMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
