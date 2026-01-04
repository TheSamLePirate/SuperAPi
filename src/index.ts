import http from 'http';
import app from './http/app';
import { initSocket } from './socket';
import { config } from './config';

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start server
server.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
});
