import { Router, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/authenticate';

export const usersRouter = Router();

// POST /users (protected — requires valid JWT)
usersRouter.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { displayName, familyId } = req.body;

  if (!displayName || !familyId) {
    res.status(400).json({ error: 'displayName and familyId are required' });
    return;
  }

  try {
    const pool = await getPool();

    await pool.request()
      .input('displayName', sql.NVarChar, displayName)
      .input('familyId', sql.UniqueIdentifier, familyId)
      .input('userId', sql.UniqueIdentifier, req.userId)
      .query(`
        UPDATE users
        SET display_name = @displayName, family_id = @familyId
        WHERE id = @userId
      `);

    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, req.userId)
      .query(`
        SELECT u.id, u.display_name, u.family_id, f.name AS family_name
        FROM users u
        LEFT JOIN families f ON u.family_id = f.id
        WHERE u.id = @userId
      `);

    if (!result.recordset.length) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.recordset[0];
    res.json({
      id: user.id,
      displayName: user.display_name,
      familyId: user.family_id ?? null,
      familyName: user.family_name ?? null,
    });
  } catch (err) {
    console.error('POST /users error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PATCH /users/me — update user preferences (D-14: share_location toggle)
usersRouter.patch('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { shareLocation } = req.body;

  if (typeof shareLocation !== 'boolean') {
    res.status(400).json({ error: 'shareLocation must be a boolean' });
    return;
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('userId', sql.UniqueIdentifier, req.userId)
      .input('shareLocation', sql.Bit, shareLocation ? 1 : 0)
      .query('UPDATE users SET share_location = @shareLocation WHERE id = @userId');

    res.json({ shareLocation });
  } catch (err) {
    console.error('PATCH /users/me error:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});
