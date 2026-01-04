"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getEnv = (key, required = true) => {
    const value = process.env[key];
    if (required && !value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || '';
};
exports.config = {
    PORT: parseInt(getEnv('PORT', false) || '3000', 10),
    API_KEY: getEnv('API_KEY', true),
    MAX_HTTP_BUFFER_SIZE: getEnv('MAX_HTTP_BUFFER_SIZE', false) || '1mb',
    ROOM_MAX_MEMBERS: parseInt(getEnv('ROOM_MAX_MEMBERS', false) || '100', 10),
};
