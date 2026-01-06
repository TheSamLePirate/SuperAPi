"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const config_1 = require("../config");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: config_1.config.MAX_HTTP_BUFFER_SIZE }));
// Monitor API requests
const middleware_1 = require("./middleware");
app.use(middleware_1.monitorRequestMiddleware);
app.use('/', routes_1.default);
exports.default = app;
