"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyMiddleware = void 0;
const config_1 = require("../config");
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== config_1.config.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    }
    next();
};
exports.apiKeyMiddleware = apiKeyMiddleware;
