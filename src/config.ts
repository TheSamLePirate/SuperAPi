import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, required: boolean = true): string => {
    const value = process.env[key];
    if (required && !value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || '';
};

export const config = {
    PORT: parseInt(getEnv('PORT', false) || '3000', 10),
    API_KEY: getEnv('API_KEY', true),
    MAX_HTTP_BUFFER_SIZE: getEnv('MAX_HTTP_BUFFER_SIZE', false) || '1mb',
    ROOM_MAX_MEMBERS: parseInt(getEnv('ROOM_MAX_MEMBERS', false) || '100', 10),
};
