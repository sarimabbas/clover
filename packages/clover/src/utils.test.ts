import { describe, it, expect } from 'vitest';
import { 
  getKeysFromPathPattern, 
  getParamsFromPath
} from './utils';

describe('utils', () => {
  describe('getKeysFromPathPattern', () => {
    it('should extract path parameters', () => {
      const pattern = '/api/users/:id';
      const keys = getKeysFromPathPattern(pattern);
      expect(keys).toHaveLength(1);
      expect(keys[0].name).toBe('id');
    });

    it('should handle multiple parameters', () => {
      const pattern = '/api/users/:userId/posts/:postId';
      const keys = getKeysFromPathPattern(pattern);
      expect(keys).toHaveLength(2);
      expect(keys[0].name).toBe('userId');
      expect(keys[1].name).toBe('postId');
    });
  });

  describe('getParamsFromPath', () => {
    it('should extract parameters from actual path', () => {
      const pattern = '/api/users/:id';
      const path = '/api/users/123';
      const params = getParamsFromPath(pattern, path);
      expect(params).toEqual({ id: '123' });
    });
  });
});