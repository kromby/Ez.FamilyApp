import { Router, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { broadcastTaskAdded, broadcastTaskUpdated, broadcastTaskDeleted } from '../lib/signalr';

export const tasksRouter = Router();

const TASK_SELECT = `
  SELECT id, family_id AS familyId, name,
    added_by_id AS addedById, added_by_name AS addedByName,
    completed_at AS completedAt, completed_by_id AS completedById,
    completed_by_name AS completedByName, created_at AS createdAt
  FROM tasks
`;

// GET /tasks — return all tasks for the authenticated user's family
tasksRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('familyId', sql.UniqueIdentifier, req.familyId)
      .query(`${TASK_SELECT} WHERE family_id = @familyId ORDER BY created_at DESC`);

    res.json({ tasks: result.recordset });
  } catch (err) {
    console.error('GET /tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /tasks — create a new task
tasksRouter.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  if (name.trim().length > 200) {
    res.status(400).json({ error: 'name must be 200 characters or fewer' });
    return;
  }

  try {
    const pool = await getPool();

    // Look up display_name for added_by_name
    const userResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, req.userId)
      .query('SELECT display_name FROM users WHERE id = @userId');

    const addedByName = userResult.recordset[0]?.display_name || 'Unknown';

    const insertResult = await pool.request()
      .input('familyId', sql.UniqueIdentifier, req.familyId)
      .input('name', sql.NVarChar(200), name.trim())
      .input('addedById', sql.UniqueIdentifier, req.userId)
      .input('addedByName', sql.NVarChar(100), addedByName)
      .query(`
        INSERT INTO tasks (family_id, name, added_by_id, added_by_name)
        OUTPUT INSERTED.id, INSERTED.family_id AS familyId, INSERTED.name,
               INSERTED.added_by_id AS addedById, INSERTED.added_by_name AS addedByName,
               INSERTED.completed_at AS completedAt, INSERTED.completed_by_id AS completedById,
               INSERTED.completed_by_name AS completedByName, INSERTED.created_at AS createdAt
        VALUES (@familyId, @name, @addedById, @addedByName)
      `);

    const task = insertResult.recordset[0];

    // D-14: fire-and-forget broadcast
    broadcastTaskAdded(req.familyId!, task).catch((err) => {
      console.error('SignalR broadcastTaskAdded failed (task already persisted):', err);
    });

    res.status(201).json({ task });
  } catch (err) {
    console.error('POST /tasks error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /tasks/:id — toggle task completion
tasksRouter.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { completed } = req.body;

  if (typeof completed !== 'boolean') {
    res.status(400).json({ error: 'completed must be a boolean' });
    return;
  }

  try {
    const pool = await getPool();

    let updateQuery: string;
    const request = pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('familyId', sql.UniqueIdentifier, req.familyId);

    if (completed) {
      // Look up display_name for completed_by_name
      const userResult = await pool.request()
        .input('userId', sql.UniqueIdentifier, req.userId)
        .query('SELECT display_name FROM users WHERE id = @userId');

      const completedByName = userResult.recordset[0]?.display_name || 'Unknown';

      request
        .input('userId', sql.UniqueIdentifier, req.userId)
        .input('completedByName', sql.NVarChar(100), completedByName);

      updateQuery = `
        UPDATE tasks
        SET completed_at = GETUTCDATE(), completed_by_id = @userId, completed_by_name = @completedByName
        WHERE id = @id AND family_id = @familyId
      `;
    } else {
      updateQuery = `
        UPDATE tasks
        SET completed_at = NULL, completed_by_id = NULL, completed_by_name = NULL
        WHERE id = @id AND family_id = @familyId
      `;
    }

    const updateResult = await request.query(updateQuery);

    if (updateResult.rowsAffected[0] === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Fetch updated task
    const taskResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('familyId', sql.UniqueIdentifier, req.familyId)
      .query(`${TASK_SELECT} WHERE id = @id AND family_id = @familyId`);

    const task = taskResult.recordset[0];

    // Fire-and-forget broadcast (always full task record per Pitfall 5)
    broadcastTaskUpdated(req.familyId!, task).catch((err) => {
      console.error('SignalR broadcastTaskUpdated failed (task already persisted):', err);
    });

    res.json({ task });
  } catch (err) {
    console.error('PATCH /tasks/:id error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /tasks/:id — remove a task (idempotent per D-15)
tasksRouter.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const pool = await getPool();

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('familyId', sql.UniqueIdentifier, req.familyId)
      .query('DELETE FROM tasks WHERE id = @id AND family_id = @familyId');

    // D-15: return 200 regardless of rowsAffected (idempotent)
    broadcastTaskDeleted(req.familyId!, id).catch((err) => {
      console.error('SignalR broadcastTaskDeleted failed:', err);
    });

    res.json({ deleted: true });
  } catch (err) {
    console.error('DELETE /tasks/:id error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});
