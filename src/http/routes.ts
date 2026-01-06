import { Router, Request, Response } from 'express';
import { apiKeyMiddleware } from './middleware';
import { store } from '../socket/store';

const router = Router();

// Public health check
router.get('/healthz', (req: Request, res: Response) => {
    res.json({ ok: true });
});

// Protected room management
router.post('/v1/rooms', apiKeyMiddleware, (req: Request, res: Response) => {
    const { roomId, createdBy } = req.body;

    if (!roomId || !createdBy) {
        return res.status(400).json({ error: 'Missing roomId or createdBy' });
    }

    try {
        const room = store.createRoom(roomId, createdBy);
        res.json(room);
    } catch (err: any) {
        res.status(409).json({ error: err.message });
    }
});

// Debug: List rooms (admin)
router.get('/v1/rooms', apiKeyMiddleware, (req: Request, res: Response) => {
    // Convert map to array of simple objects to avoid serialization issues with Sets/Maps
    const rooms = store.getAllRooms().map(r => ({
        ...r,
        admins: Array.from(r.admins),
        bannedUserIds: Array.from(r.bannedUserIds),
        // Members is a Map, convert to array of values
        members: Array.from(r.members.values())
    }));
    res.json(rooms);
});

// Send event to socket room
router.post('/toSocket/:event', apiKeyMiddleware, (req: Request, res: Response) => {
    const { event } = req.params;
    const { roomId, payload } = req.body;

    if (!roomId) {
        return res.status(400).json({ error: 'Missing roomId' });
    }

    const io = req.app.get('io');
    if (!io) {
        return res.status(500).json({ error: 'Socket.IO not initialized' });
    }

    io.to(roomId).emit(event, payload);
    res.json({ success: true, event, roomId });
});

// Set memory data
router.post('/memory/:dataName', apiKeyMiddleware, (req: Request, res: Response) => {
    const { dataName } = req.params;
    store.setMemory(dataName, req.body);
    res.json({ success: true, key: dataName });
});

// Get memory data
router.get('/memory/:dataName', apiKeyMiddleware, (req: Request, res: Response) => {
    const { dataName } = req.params;
    const data = store.getMemory(dataName);

    if (data === undefined) {
        return res.status(404).json({ error: 'Data not found' });
    }

    res.json(data);
});

export default router;
