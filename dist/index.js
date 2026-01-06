"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const peer_1 = require("peer");
const app_1 = __importDefault(require("./http/app"));
const socket_1 = require("./socket");
const config_1 = require("./config");
const server = http_1.default.createServer(app_1.default);
// Initialize Socket.IO
const io = (0, socket_1.initSocket)(server);
app_1.default.set('io', io);
// Initialize PeerJS (isolate with mock server)
const peerServerMock = http_1.default.createServer();
const peerServer = (0, peer_1.ExpressPeerServer)(peerServerMock, {
    path: '/myapp', // Avoid root path to prevent conflict with Socket.IO
    allow_discovery: true
});
app_1.default.use('/peerjs', peerServer);
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
server.listen(config_1.config.PORT, () => {
    console.log(`Server running on port ${config_1.config.PORT}`);
});
