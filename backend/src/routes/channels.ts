import { Router, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/authenticate';

export const channelsRouter = Router();

// GET /channels — list family channels (name + last message snippet + timestamp)
channelsRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('GET /channels — userId:', req.userId, 'familyId:', req.familyId);
    const pool = await getPool();
    const result = await pool.request()
      .input('familyId', sql.UniqueIdentifier, req.familyId)
      .query(`
        SELECT id, name, last_message_at AS lastMessageAt, last_message_text AS lastMessageText, created_at AS createdAt
        FROM channels
        WHERE family_id = @familyId
        ORDER BY COALESCE(last_message_at, created_at) DESC
      `);
    res.json({ channels: result.recordset });
  } catch (err) {
    console.error('GET /channels error:', err);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// POST /channels — create a channel (name input modal)
channelsRouter.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;

  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  // Validation: 1-50 chars, letters/numbers/spaces/hyphens only
  const trimmed = name.trim();
  const validPattern = /^[a-zA-Z0-9 \-]{1,50}$/;
  if (!validPattern.test(trimmed)) {
    res.status(400).json({ error: 'Channel name must be 1-50 characters. Letters, numbers, spaces, and hyphens only.' });
    return;
  }

  try {
    const pool = await getPool();

    // Check for duplicate name within family (case-insensitive)
    const existing = await pool.request()
      .input('familyId', sql.UniqueIdentifier, req.familyId)
      .input('name', sql.NVarChar, trimmed.toLowerCase())
      .query('SELECT id FROM channels WHERE family_id = @familyId AND LOWER(name) = @name');

    if (existing.recordset.length > 0) {
      res.status(409).json({ error: 'A channel with this name already exists' });
      return;
    }

    const result = await pool.request()
      .input('familyId', sql.UniqueIdentifier, req.familyId)
      .input('name', sql.NVarChar, trimmed)
      .input('createdBy', sql.UniqueIdentifier, req.userId)
      .query(`
        INSERT INTO channels (family_id, name, created_by)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.created_at AS createdAt
        VALUES (@familyId, @name, @createdBy)
      `);

    res.status(201).json({ channel: result.recordset[0] });
  } catch (err) {
    console.error('POST /channels error:', err);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});
