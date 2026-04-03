import { Router, Request, Response } from 'express';
import sql from 'mssql';
import jwt from 'jsonwebtoken';
import { getPool } from '../db/connection';
import { sendOtpEmail } from '../lib/mailer';

export const authRouter = Router();

// POST /auth/request-otp
authRouter.post('/request-otp', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'email is required' });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    const pool = await getPool();
    await pool.request()
      .input('email', sql.NVarChar, email)
      .input('otp', sql.NVarChar, otp)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .query(`
        MERGE otp_requests AS target
        USING (SELECT @email AS email) AS source ON target.email = source.email
        WHEN MATCHED THEN UPDATE SET otp = @otp, expires_at = @expiresAt, attempts = 0
        WHEN NOT MATCHED THEN INSERT (email, otp, expires_at, attempts)
          VALUES (@email, @otp, @expiresAt, 0);
      `);

    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error('request-otp error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /auth/verify-otp
authRouter.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ error: 'email and otp are required' });
    return;
  }

  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('otp', sql.NVarChar, otp)
      .query(`
        SELECT * FROM otp_requests
        WHERE email = @email AND otp = @otp AND expires_at > GETUTCDATE()
      `);

    if (!result.recordset.length) {
      res.status(401).json({ error: 'Invalid or expired code' });
      return;
    }

    // Delete OTP immediately — prevents replay attacks
    await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`DELETE FROM otp_requests WHERE email = @email`);

    // Look up user by email
    let userResult = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT u.id, u.display_name, u.family_id, f.name AS family_name
        FROM users u
        LEFT JOIN families f ON u.family_id = f.id
        WHERE u.email = @email
      `);

    let userId: string;
    let displayName: string;
    let familyId: string | null;
    let familyName: string | null;

    if (!userResult.recordset.length) {
      // Create new user with empty display_name and null family_id
      const createResult = await pool.request()
        .input('email', sql.NVarChar, email)
        .query(`
          INSERT INTO users (email, display_name, family_id)
          OUTPUT INSERTED.id, INSERTED.display_name, INSERTED.family_id
          VALUES (@email, '', NULL)
        `);
      userId = createResult.recordset[0].id;
      displayName = createResult.recordset[0].display_name;
      familyId = createResult.recordset[0].family_id ?? null;
      familyName = null;
    } else {
      userId = userResult.recordset[0].id;
      displayName = userResult.recordset[0].display_name;
      familyId = userResult.recordset[0].family_id ?? null;
      familyName = userResult.recordset[0].family_name ?? null;
    }

    const token = jwt.sign(
      { userId, familyId },
      process.env.JWT_SECRET!,
      { expiresIn: '90d' }
    );

    res.json({
      token,
      user: {
        id: userId,
        displayName,
        familyId,
        familyName,
      },
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});
