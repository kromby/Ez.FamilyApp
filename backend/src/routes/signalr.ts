import { Router, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { generateNegotiatePayload, addUserToGroup } from '../lib/signalr';

export const signalrRouter = Router();

// POST /signalr/negotiate — client calls this to get SignalR connection URL + token
// Also handle GET (some SignalR client versions use GET for negotiate)
signalrRouter.post('/negotiate', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('POST /signalr/negotiate — userId:', req.userId);
    const payload = generateNegotiatePayload(req.userId!);
    res.json(payload);
  } catch (err) {
    console.error('POST /signalr/negotiate error:', err);
    res.status(500).json({ error: 'Failed to negotiate SignalR connection' });
  }
});

signalrRouter.get('/negotiate', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('GET /signalr/negotiate — userId:', req.userId);
    const payload = generateNegotiatePayload(req.userId!);
    res.json(payload);
  } catch (err) {
    console.error('GET /signalr/negotiate error:', err);
    res.status(500).json({ error: 'Failed to negotiate SignalR connection' });
  }
});

// POST /signalr/join-channels — add user to all their family's channel groups
// Called by client after SignalR connection is established and on reconnect
signalrRouter.post('/join-channels', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('familyId', sql.UniqueIdentifier, req.familyId)
      .query('SELECT id FROM channels WHERE family_id = @familyId');

    const channels = result.recordset;
    await Promise.all(
      channels.map((ch: { id: string }) => addUserToGroup(req.userId!, ch.id))
    );

    // Also join family-tasks group for real-time task sync
    await addUserToGroup(req.userId!, `family-tasks-${req.familyId}`);

    res.json({ joined: channels.length, tasksGroup: true });
  } catch (err) {
    console.error('POST /signalr/join-channels error:', err);
    res.status(500).json({ error: 'Failed to join channel groups' });
  }
});
