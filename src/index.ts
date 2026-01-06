import http from 'http';
import { ExpressPeerServer } from 'peer';
import app from './http/app';
import { initSocket } from './socket';
import { config } from './config';

const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);
app.set('io', io);

// Initialize PeerJS (isolate with mock server)
const peerServerMock = http.createServer();
const peerServer = ExpressPeerServer(peerServerMock, {
    path: '/myapp', // Avoid root path to prevent conflict with Socket.IO
    allow_discovery: true
});
app.use('/peerjs', peerServer);

// Manual Upgrade Routing
server.on('upgrade', (req, socket, head) => {
    // Forward PeerJS upgrades to the mock server
    // Check if the URL matches PeerJS expectations (usually starts with mount path + configured path)
    // Client usually connects to /peerjs/myapp
    if (req.url?.startsWith('/peerjs') || req.url?.startsWith('/myapp')) {
        peerServerMock.emit('upgrade', req, socket, head);
    }
    // Note: Socket.IO automatically attaches its own listener to 'server' via initSocket,
    // so it handles /socket.io requests automatically. 
});

// Start server
server.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
});
