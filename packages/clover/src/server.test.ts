import { describe, it, expect } from 'vitest';
import { makeRequestHandler } from './server';
import { z } from 'zod';

describe('makeRequestHandler', () => {
  it('should create a handler that validates input', async () => {
    const { handler } = makeRequestHandler({
      input: z.object({ name: z.string() }),
      output: z.object({ greeting: z.string() }),
      method: 'GET',
      path: '/api/hello',
      run: async ({ input, sendOutput }) => {
        return sendOutput({ greeting: `Hello, ${input.name}!` });
      }
    });

    const response = await handler(
      new Request('http://test.com/api/hello?name=test')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ greeting: 'Hello, test!' });
  });

  it('should return 400 for invalid input', async () => {
    const { handler } = makeRequestHandler({
      input: z.object({ name: z.string() }),
      output: z.object({ greeting: z.string() }),
      method: 'GET',
      path: '/api/hello',
      run: async ({ input, sendOutput }) => {
        return sendOutput({ greeting: `Hello, ${input.name}!` });
      }
    });

    const response = await handler(
      new Request('http://test.com/api/hello')
    );

    expect(response.status).toBe(400);
  });

  it('should put path params in the input', async () => {
    const { handler } = makeRequestHandler({
      input: z.object({ name: z.string() }),
      output: z.object({ greeting: z.string() }),
      method: 'GET',
      path: '/api/hello/:name',
      run: async ({ input, sendOutput }) => {
        return sendOutput({ greeting: `Hello, ${input.name}!` });
      }
    });

    const response = await handler(
      new Request('http://test.com/api/hello/test')
    );
    const data = await response.json();

    expect(data).toEqual({ greeting: 'Hello, test!' });
  });

  it('should put query params in the input', async () => {
    const { handler } = makeRequestHandler({
      input: z.object({ name: z.string() }),
      output: z.object({ greeting: z.string() }),
      method: 'GET',
      path: '/api/hello',
      run: async ({ input, sendOutput }) => {
        return sendOutput({ greeting: `Hello, ${input.name}!` });
      }
    });

    const response = await handler(
      new Request('http://test.com/api/hello?name=test')
    );
    const data = await response.json();

    expect(data).toEqual({ greeting: 'Hello, test!' });
  });

  it('should put request body in the input', async () => {
    const { handler } = makeRequestHandler({
      input: z.object({ name: z.string() }),
      output: z.object({ greeting: z.string() }),
      method: 'POST',
      path: '/api/hello',
      run: async ({ input, sendOutput }) => {
        return sendOutput({ greeting: `Hello, ${input.name}!` });
      }
    });

    const response = await handler(
      new Request('http://test.com/api/hello', { method: 'POST', body: JSON.stringify({ name: 'test' }) })
    );
    const data = await response.json();

    expect(data).toEqual({ greeting: 'Hello, test!' });
  });

  it('should return a 405 if the method is not supported', async () => {
    const { handler } = makeRequestHandler({
      input: z.object({ name: z.string() }),
      output: z.object({ greeting: z.string() }),
      method: 'GET',
      path: '/api/hello',
      run: async ({ input, sendOutput }) => {
        return sendOutput({ greeting: `Hello, ${input.name}!` });
      }
    });

    const response = await handler(
      new Request('http://test.com/api/hello', { method: 'POST' })
    );

    expect(response.status).toBe(405);
  });

  it('should return a different status code if the handler returns a different status code', async () => {
    const statusCode = 404;

    const { handler } = makeRequestHandler({
      input: z.object({ name: z.string() }),
      output: z.object({ greeting: z.string() }),
      method: 'GET',
      path: '/api/hello',
      run: async ({ input, sendOutput }) => {
        return sendOutput({ greeting: `Hello, ${input.name}!` }, {
          status: statusCode
        });
      }
    });

    const response = await handler(
      new Request('http://test.com/api/hello?name=test')
    );

    expect(response.status).toBe(404);
  });

  it('should return custom headers if the handler returns custom headers', async () => {
    const { handler } = makeRequestHandler({
      input: z.object({ name: z.string() }),
      output: z.object({ greeting: z.string() }),
      method: 'GET',
      path: '/api/hello',
      run: async ({ input, sendOutput }) => {
        return sendOutput({ greeting: `Hello, ${input.name}!` }, {
          headers: {
            'X-Custom-Header': 'test'
          }
        });
      }
    });

    const response = await handler(
      new Request('http://test.com/api/hello?name=test')
    );

    expect(response.headers.get('X-Custom-Header')).toBe('test');
  });

  it('should return a 500 if the handler throws an error', async () => {
    const { handler } = makeRequestHandler({
      input: z.object({ name: z.string() }),
      output: z.object({ greeting: z.string() }),
      method: 'GET',
      path: '/api/hello',
      run: async () => {
        throw new Error('test');
      }
    });

    const response = await handler(
      new Request('http://test.com/api/hello?name=test')
    );

    expect(response.status).toBe(500);
  });

  it('should return a 401 if the handler expects a user to be authenticated', async () => {
    const { handler } = makeRequestHandler({
      input: z.object({ name: z.string() }),
      output: z.object({ greeting: z.string() }),
      method: 'GET',
      path: '/api/hello',
      run: async ({ input, sendOutput }) => {
        return sendOutput({ greeting: `Hello, ${input.name}!` });
      },
      // Deny the user for this test
      authenticate: async () => false
    });

    const response = await handler(
      new Request('http://test.com/api/hello?name=test')
    );

    expect(response.status).toBe(401);
  });
});

