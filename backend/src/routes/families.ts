import { Router, Request, Response } from 'express';
import sql from 'mssql';
import rateLimit from 'express-rate-limit';
import { getPool } from '../db/connection';
import { generateFamilyCode } from '../lib/familyCode';
import { authenticate, AuthRequest } from '../middleware/authenticate';

export const familiesRouter = Router();

const joinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many join attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /families (protected — requires valid JWT)
familiesRouter.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  try {
    const pool = await getPool();
    let code: string = '';
    let attempts = 0;

    // Collision loop — astronomically unlikely but correct
    do {
      code = generateFamilyCode();
      const existing = await pool.request()
        .input('code', sql.NVarChar, code)
        .query('SELECT id FROM families WHERE code = @code');
      if (!existing.recordset.length) break;
      attempts++;
    } while (attempts < 5);

    const insertResult = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('code', sql.NVarChar, code)
      .query(`
        INSERT INTO families (name, code)
        OUTPUT INSERTED.id
        VALUES (@name, @code)
      `);

    const familyId: string = insertResult.recordset[0].id;

    // Update the creating user's family_id
    await pool.request()
      .input('familyId', sql.UniqueIdentifier, familyId)
      .input('userId', sql.UniqueIdentifier, req.userId)
      .query('UPDATE users SET family_id = @familyId WHERE id = @userId');

    // D-03: Auto-create #general channel for every new family
    await pool.request()
      .input('familyId2', sql.UniqueIdentifier, familyId)
      .input('createdBy', sql.UniqueIdentifier, req.userId)
      .query(`
        INSERT INTO channels (family_id, name, created_by)
        VALUES (@familyId2, 'general', @createdBy)
      `);

    res.json({ familyId, code });
  } catch (err) {
    console.error('POST /families error:', err);
    res.status(500).json({ error: 'Failed to create family' });
  }
});

// POST /families/join (rate-limited — NO auth required)
familiesRouter.post('/join', joinRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ error: 'code is required' });
    return;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('code', sql.NVarChar, code.toUpperCase())
      .query('SELECT id, name FROM families WHERE code = @code');

    if (!result.recordset.length) {
      res.status(404).json({ error: "We couldn't find a family with that code. Double-check the code and try again." });
      return;
    }

    res.json({
      familyId: result.recordset[0].id,
      familyName: result.recordset[0].name,
    });
  } catch (err) {
    console.error('POST /families/join error:', err);
    res.status(500).json({ error: 'Failed to join family' });
  }
});
