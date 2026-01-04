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

export default router;
