describe('POST /messages', () => {
  it.todo('sends a message to a channel');
  it.todo('returns 401 without auth token');
  it.todo('returns 400 without text');
});

describe('GET /messages', () => {
  it.todo('returns paginated messages for a channel');
  it.todo('returns messages with sender_name and created_at (message shape)');
  it.todo('supports cursor-based pagination');
});
