import { Router, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { broadcastToChannel, broadcastReaction } from '../lib/signalr';

export const messagesRouter = Router();

// POST /messages — send a message (D-09: persist first, then broadcast)
messagesRouter.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { channelId, text, latitude, longitude } = req.body;

  if (!channelId || !text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'channelId and text are required' });
    return;
  }

  let lat: number | null = null;
  let lng: number | null = null;
  if (latitude !== undefined && latitude !== null) {
    lat = parseFloat(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      res.status(400).json({ error: 'latitude must be between -90 and 90' });
      return;
    }
  }
  if (longitude !== undefined && longitude !== null) {
    lng = parseFloat(longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      res.status(400).json({ error: 'longitude must be between -180 and 180' });
      return;
    }
  }

  try {
    const pool = await getPool();

    // Verify channel belongs to user's family
    const channelCheck = await pool.request()
      .input('channelId', sql.UniqueIdentifier, channelId)
      .input('familyId', sql.UniqueIdentifier, req.familyId)
      .query('SELECT id FROM channels WHERE id = @channelId AND family_id = @familyId');

    if (channelCheck.recordset.length === 0) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    // D-09: Persist to Azure SQL first
    const insertResult = await pool.request()
      .input('channelId', sql.UniqueIdentifier, channelId)
      .input('senderId', sql.UniqueIdentifier, req.userId)
      .input('text', sql.NVarChar, text.trim())
      .input('lat', sql.Float, lat)
      .input('lng', sql.Float, lng)
      .query(`
        INSERT INTO messages (channel_id, sender_id, text, latitude, longitude)
        OUTPUT INSERTED.id, INSERTED.channel_id AS channelId, INSERTED.sender_id AS senderId,
               INSERTED.text, INSERTED.created_at AS createdAt,
               INSERTED.latitude, INSERTED.longitude
        VALUES (@channelId, @senderId, @text, @lat, @lng)
      `);

    const message = insertResult.recordset[0];

    // Update channel's last_message_at and last_message_text for channel list preview (D-01)
    const snippet = text.trim().length > 200 ? text.trim().substring(0, 200) : text.trim();
    await pool.request()
      .input('channelId2', sql.UniqueIdentifier, channelId)
      .input('lastMessageAt', sql.DateTime2, message.createdAt)
      .input('lastMessageText', sql.NVarChar, snippet)
      .query(`
        UPDATE channels
        SET last_message_at = @lastMessageAt, last_message_text = @lastMessageText
        WHERE id = @channelId2
      `);

    // Get sender display name for broadcast payload (MSG-06)
    const userResult = await pool.request()
      .input('senderId', sql.UniqueIdentifier, req.userId)
      .query('SELECT display_name FROM users WHERE id = @senderId');

    const senderName = userResult.recordset[0]?.display_name || 'Unknown';

    // Upsert member_locations if coordinates provided (LOC-01)
    if (lat !== null && lng !== null) {
      await pool.request()
        .input('mlUserId', sql.UniqueIdentifier, req.userId)
        .input('mlFamilyId', sql.UniqueIdentifier, req.familyId)
        .input('mlLat', sql.Float, lat)
        .input('mlLng', sql.Float, lng)
        .input('mlMsgId', sql.UniqueIdentifier, message.id)
        .query(`
          MERGE member_locations AS target
          USING (SELECT @mlUserId AS user_id, @mlFamilyId AS family_id, @mlLat AS latitude, @mlLng AS longitude, @mlMsgId AS message_id) AS source
          ON target.user_id = source.user_id
          WHEN MATCHED THEN UPDATE SET latitude = source.latitude, longitude = source.longitude, message_id = source.message_id, updated_at = GETUTCDATE()
          WHEN NOT MATCHED THEN INSERT (user_id, family_id, latitude, longitude, message_id, updated_at) VALUES (source.user_id, source.family_id, source.latitude, source.longitude, source.message_id, GETUTCDATE());
        `);
    }

    const broadcastPayload = {
      ...message,
      senderName,
      latitude: message.latitude ?? null,
      longitude: message.longitude ?? null,
      reactions: [],
    };

    // D-09: Then broadcast via SignalR
    broadcastToChannel(channelId, broadcastPayload).catch((err) => {
      console.error('SignalR broadcast failed (message already persisted):', err);
    });

    res.status(201).json({ message: broadcastPayload });
  } catch (err) {
    console.error('POST /messages error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /messages?channelId=X&cursor=Y&limit=Z — paginated message history
// D-11: cursor-based pagination, batch size 30, oldest messages loaded on scroll up
messagesRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { channelId, cursor, limit: limitStr } = req.query;

  if (!channelId || typeof channelId !== 'string') {
    res.status(400).json({ error: 'channelId query parameter is required' });
    return;
  }

  const pageSize = Math.min(parseInt(limitStr as string) || 30, 50);

  try {
    const pool = await getPool();

    // Verify channel belongs to user's family
    const channelCheck = await pool.request()
      .input('channelId', sql.UniqueIdentifier, channelId)
      .input('familyId', sql.UniqueIdentifier, req.familyId)
      .query('SELECT id FROM channels WHERE id = @channelId AND family_id = @familyId');

    if (channelCheck.recordset.length === 0) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    let query: string;
    const request = pool.request()
      .input('channelId2', sql.UniqueIdentifier, channelId)
      .input('pageSize', sql.Int, pageSize);

    if (cursor && typeof cursor === 'string') {
      // Keyset pagination: fetch messages older than cursor (created_at of oldest visible)
      request.input('cursor', sql.DateTime2, cursor);
      query = `
        SELECT TOP (@pageSize)
          m.id, m.channel_id AS channelId, m.sender_id AS senderId,
          m.text, m.created_at AS createdAt,
          m.latitude, m.longitude,
          u.display_name AS senderName
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.channel_id = @channelId2
          AND m.created_at < @cursor
        ORDER BY m.created_at DESC
      `;
    } else {
      // No cursor: fetch newest messages
      query = `
        SELECT TOP (@pageSize)
          m.id, m.channel_id AS channelId, m.sender_id AS senderId,
          m.text, m.created_at AS createdAt,
          m.latitude, m.longitude,
          u.display_name AS senderName
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.channel_id = @channelId2
        ORDER BY m.created_at DESC
      `;
    }

    const result = await request.query(query);
    const messages = result.recordset;

    // Fetch reactions for all messages in this page
    if (messages.length > 0) {
      const messageIds = messages.map((m: any) => m.id);
      // Build dynamic query for message IDs
      const idPlaceholders = messageIds.map((_: any, i: number) => `@mid${i}`).join(',');
      const reactionsReq = pool.request();
      messageIds.forEach((id: string, i: number) => {
        reactionsReq.input(`mid${i}`, sql.UniqueIdentifier, id);
      });

      const reactionsResult = await reactionsReq.query(`
        SELECT message_id AS messageId, emoji, COUNT(*) AS count,
          STRING_AGG(CAST(user_id AS NVARCHAR(36)), ',') AS userIds
        FROM message_reactions
        WHERE message_id IN (${idPlaceholders})
        GROUP BY message_id, emoji
      `);

      // Group reactions by messageId
      const reactionsByMessage: Record<string, any[]> = {};
      for (const r of reactionsResult.recordset) {
        if (!reactionsByMessage[r.messageId]) reactionsByMessage[r.messageId] = [];
        reactionsByMessage[r.messageId].push({
          emoji: r.emoji,
          count: r.count,
          userIds: r.userIds.split(','),
        });
      }

      // Attach reactions to messages
      for (const msg of messages) {
        (msg as any).reactions = reactionsByMessage[msg.id] || [];
      }
    }

    // Determine if there are more older messages
    const hasMore = messages.length === pageSize;
    const nextCursor = hasMore && messages.length > 0
      ? messages[messages.length - 1].createdAt
      : null;

    res.json({ messages, nextCursor, hasMore });
  } catch (err) {
    console.error('GET /messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /messages/:messageId/reactions — toggle a reaction (D-12, D-14, Pitfall 5)
messagesRouter.post('/:messageId/reactions', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  const allowedEmojis = ['\uD83D\uDC4D', '\u2764\uFE0F', '\uD83D\uDE02', '\uD83D\uDE2E', '\uD83D\uDE22', '\uD83D\uDE21'];
  // That's: thumbs-up, heart, laugh, surprised, sad, angry

  if (!emoji || !allowedEmojis.includes(emoji)) {
    res.status(400).json({ error: 'Invalid emoji. Must be one of the allowed reactions.' });
    return;
  }

  try {
    const pool = await getPool();

    // Check if reaction already exists
    const existing = await pool.request()
      .input('messageId', sql.UniqueIdentifier, messageId)
      .input('userId', sql.UniqueIdentifier, req.userId)
      .input('emoji', sql.NVarChar, emoji)
      .query('SELECT id FROM message_reactions WHERE message_id = @messageId AND user_id = @userId AND emoji = @emoji');

    let action: 'added' | 'removed';

    if (existing.recordset.length > 0) {
      // Remove existing reaction
      await pool.request()
        .input('messageId', sql.UniqueIdentifier, messageId)
        .input('userId', sql.UniqueIdentifier, req.userId)
        .input('emoji', sql.NVarChar, emoji)
        .query('DELETE FROM message_reactions WHERE message_id = @messageId AND user_id = @userId AND emoji = @emoji');
      action = 'removed';
    } else {
      // Add new reaction
      await pool.request()
        .input('messageId', sql.UniqueIdentifier, messageId)
        .input('userId', sql.UniqueIdentifier, req.userId)
        .input('emoji', sql.NVarChar, emoji)
        .query('INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (@messageId, @userId, @emoji)');
      action = 'added';
    }

    // Fetch updated reaction aggregates for this message
    const reactionsResult = await pool.request()
      .input('messageId2', sql.UniqueIdentifier, messageId)
      .query(`
        SELECT emoji, COUNT(*) AS count,
          STRING_AGG(CAST(user_id AS NVARCHAR(36)), ',') AS userIds
        FROM message_reactions
        WHERE message_id = @messageId2
        GROUP BY emoji
      `);

    const reactions = reactionsResult.recordset.map((r: any) => ({
      emoji: r.emoji,
      count: r.count,
      userIds: r.userIds.split(','),
    }));

    // Get channelId for broadcast
    const msgResult = await pool.request()
      .input('messageId3', sql.UniqueIdentifier, messageId)
      .query('SELECT channel_id FROM messages WHERE id = @messageId3');

    const channelId = msgResult.recordset[0]?.channel_id;

    if (channelId) {
      broadcastReaction(channelId, { channelId, messageId, reactions }).catch((err) => {
        console.error('SignalR reaction broadcast failed:', err);
      });
    }

    res.json({ action, reactions });
  } catch (err) {
    console.error('POST /messages/:messageId/reactions error:', err);
    res.status(500).json({ error: 'Failed to toggle reaction' });
  }
});
