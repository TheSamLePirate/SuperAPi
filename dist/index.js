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
// Initialize PeerJS
const peerServer = (0, peer_1.ExpressPeerServer)(server, {
    path: '/',
    allow_discovery: true
});
app_1.default.use('/peerjs', peerServer);
// Start server
server.listen(config_1.config.PORT, () => {
    console.log(`Server running on port ${config_1.config.PORT}`);
    console.log("Version 1.1.1");
});
