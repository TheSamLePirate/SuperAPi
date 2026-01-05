import http from 'http';
import { ExpressPeerServer } from 'peer';
import app from './http/app';
import { initSocket } from './socket';
import { config } from './config';

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Initialize PeerJS
const peerServer = ExpressPeerServer(server, {
    path: '/',
    allow_discovery: true
});
app.use('/peerjs', peerServer);

// Start server
server.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
});
