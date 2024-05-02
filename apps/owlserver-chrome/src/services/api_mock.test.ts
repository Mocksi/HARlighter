import { expect, test } from 'vitest'
import ApiMock from './api_mock';

const mockData = {
    '/api/users': {
      body: { id: 1, name: 'John Doe' },
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
    'GET /api/posts': {
      body: [{ id: 1, title: 'Post 1' }, { id: 2, title: 'Post 2' }],
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  };

test('should return a mocked response for a valid URL', async () => {
    const apiMock = new ApiMock({ mockData, delay: 100 });
    const response = await apiMock.fetch('/api/users');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id: 1, name: 'John Doe' });
})