"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("./middleware");
const store_1 = require("../socket/store");
const router = (0, express_1.Router)();
// Public health check
router.get('/healthz', (req, res) => {
    res.json({ ok: true });
});
// Protected room management
router.post('/v1/rooms', middleware_1.apiKeyMiddleware, (req, res) => {
    const { roomId, createdBy } = req.body;
    if (!roomId || !createdBy) {
        return res.status(400).json({ error: 'Missing roomId or createdBy' });
    }
    try {
        const room = store_1.store.createRoom(roomId, createdBy);
        res.json(room);
    }
    catch (err) {
        res.status(409).json({ error: err.message });
    }
});
// Debug: List rooms (admin)
router.get('/v1/rooms', middleware_1.apiKeyMiddleware, (req, res) => {
    // Convert map to array of simple objects to avoid serialization issues with Sets/Maps
    const rooms = store_1.store.getAllRooms().map(r => ({
        ...r,
        admins: Array.from(r.admins),
        bannedUserIds: Array.from(r.bannedUserIds),
        // Members is a Map, convert to array of values
        members: Array.from(r.members.values())
    }));
    res.json(rooms);
});
exports.default = router;
