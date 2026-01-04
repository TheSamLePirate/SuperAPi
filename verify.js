"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_client_1 = require("socket.io-client");
var axios_1 = require("axios");
var PORT = 3000;
var URL = "http://192.168.1.111:".concat(PORT);
var API_KEY = 'dev-secret-key-123';
var sleep = function (ms) { return new Promise(function (r) { return setTimeout(r, ms); }); };
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var health, roomRes, e_1, clientA_1, clientB_1, roomId_1, messagePromise, err_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 10, , 11]);
                    console.log('--- Starting Verification ---');
                    console.log('1. Testing HTTP /healthz...');
                    return [4 /*yield*/, axios_1.default.get("".concat(URL, "/healthz"))];
                case 1:
                    health = _c.sent();
                    if (!health.data.ok)
                        throw new Error('Health check failed');
                    console.log('✅ Health check passed');
                    console.log('2. Testing HTTP POST /v1/rooms (Admin)...');
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, axios_1.default.post("".concat(URL, "/v1/rooms"), {
                            roomId: 'admin-room',
                            createdBy: 'admin-user'
                        }, {
                            headers: { 'x-api-key': API_KEY }
                        })];
                case 3:
                    roomRes = _c.sent();
                    if (roomRes.data.roomId !== 'admin-room')
                        throw new Error('Room creation failed');
                    console.log('✅ Admin room creation passed');
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _c.sent();
                    console.error('Room creation failed:', ((_a = e_1.response) === null || _a === void 0 ? void 0 : _a.data) || e_1.message);
                    throw e_1;
                case 5:
                    console.log('3. Connecting Socket Clients...');
                    clientA_1 = (0, socket_io_client_1.io)(URL, {
                        auth: { apiKey: API_KEY, userId: 'userA' },
                        transports: ['websocket']
                    });
                    clientB_1 = (0, socket_io_client_1.io)(URL, {
                        auth: { apiKey: API_KEY, userId: 'userB' },
                        transports: ['websocket']
                    });
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var connected = 0;
                            var check = function () {
                                connected++;
                                if (connected === 2)
                                    resolve();
                            };
                            clientA_1.on('connect', check);
                            clientB_1.on('connect', check);
                            clientA_1.on('connect_error', reject);
                            clientB_1.on('connect_error', reject);
                            setTimeout(function () { return reject(new Error('Connection timeout')); }, 5000);
                        })];
                case 6:
                    _c.sent();
                    console.log('✅ Clients connected');
                    console.log('4. UserA creates room...');
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            clientA_1.emit('room:create', { roomId: 'chat-room' }, function (res) {
                                if (res.error)
                                    reject(new Error(res.error));
                                else
                                    resolve(res.roomId);
                            });
                        })];
                case 7:
                    roomId_1 = _c.sent();
                    console.log("\u2705 Room created: ".concat(roomId_1));
                    console.log('5. UserB joins room...');
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            clientB_1.emit('room:join', { roomId: roomId_1 }, function (res) {
                                if (res.error)
                                    reject(new Error(res.error));
                                else {
                                    if (res.role === 'member')
                                        resolve();
                                    else
                                        reject(new Error("Unexpected role: ".concat(res.role)));
                                }
                            });
                        })];
                case 8:
                    _c.sent();
                    console.log('✅ UserB joined');
                    console.log('6. Testing Messaging...');
                    messagePromise = new Promise(function (resolve, reject) {
                        clientB_1.on('chat-event', function (msg) {
                            if (msg.payload.text === 'Hello B!') {
                                console.log('✅ UserB received message:', msg);
                                resolve();
                            }
                            else {
                                reject(new Error('Received wrong message'));
                            }
                        });
                    });
                    clientA_1.emit('room:emit', {
                        roomId: roomId_1,
                        event: 'chat-event',
                        payload: { text: 'Hello B!' }
                    }, function (ack) {
                        if (!ack.ok)
                            throw new Error('Emit ack failed');
                    });
                    return [4 /*yield*/, messagePromise];
                case 9:
                    _c.sent();
                    console.log('--- Verification Success ---');
                    process.exit(0);
                    return [3 /*break*/, 11];
                case 10:
                    err_1 = _c.sent();
                    console.error('❌ Verification Failed:', err_1.message);
                    if (axios_1.default.isAxiosError(err_1)) {
                        console.error('Response:', (_b = err_1.response) === null || _b === void 0 ? void 0 : _b.data);
                    }
                    process.exit(1);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
main();
