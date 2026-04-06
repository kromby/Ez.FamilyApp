import { Router, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/authenticate';

export const locationsRouter = Router();

// GET /locations/family/:familyId/members — all members with last known location (LOC-02, LOC-03)
locationsRouter.get('/family/:familyId/members', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { familyId } = req.params;

  // T-3-02: Cross-family access check
  if (req.familyId !== familyId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('familyId', sql.UniqueIdentifier, familyId)
      .query(`
        SELECT
          u.id AS userId,
          u.display_name AS displayName,
          u.share_location AS shareLocation,
          ml.latitude,
          ml.longitude,
          ml.address,
          ml.updated_at AS updatedAt
        FROM users u
        LEFT JOIN member_locations ml ON u.id = ml.user_id
        WHERE u.family_id = @familyId
        ORDER BY u.display_name
      `);

    const members = result.recordset.map((r: any) => ({
      userId: r.userId,
      displayName: r.displayName,
      shareLocation: !!r.shareLocation,
      latitude: r.shareLocation ? r.latitude : null,
      longitude: r.shareLocation ? r.longitude : null,
      address: r.shareLocation ? r.address : null,
      updatedAt: r.shareLocation ? r.updatedAt : null,
    }));

    res.json({ members });
  } catch (err) {
    console.error('GET /locations/family/:familyId/members error:', err);
    res.status(500).json({ error: 'Failed to fetch member locations' });
  }
});
