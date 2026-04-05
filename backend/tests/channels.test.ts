describe('GET /channels', () => {
  it.todo('returns channels for authenticated user family');
  it.todo('returns 401 without auth token');
  it.todo('returns empty array for family with only #general');
});

describe('POST /channels', () => {
  it.todo('creates a channel with valid name');
  it.todo('rejects duplicate channel name within same family');
  it.todo('rejects channel name exceeding 50 characters');
  it.todo('rejects channel name with invalid characters');
  it.todo('returns 401 without auth token');
});
