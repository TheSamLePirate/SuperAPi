import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== config.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    }

    next();
};
