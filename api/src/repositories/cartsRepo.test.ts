import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartsRepository } from './cartsRepo';
import { NotFoundError } from '../utils/errors';

// Mock the getDatabase function first
vi.mock('../db/sqlite', () => ({
  getDatabase: vi.fn()
}));

describe('CartsRepository', () => {
  let repository: CartsRepository;
  let mockDb: any;

  beforeEach(() => {
    // Create mock database connection
    mockDb = {
      db: {} as any,
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
      close: vi.fn()
    };

    repository = new CartsRepository(mockDb);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all carts', async () => {
      const mockResults = [
        { cart_id: 1, user_id: 'user-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
      ];
      mockDb.all.mockResolvedValue(mockResults);

      const result = await repository.findAll();

      expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM carts ORDER BY cart_id');
      expect(result).toHaveLength(1);
      expect(result[0].cartId).toBe(1);
      expect(result[0].userId).toBe('user-1');
    });

    it('should return empty array when no carts exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return cart when found', async () => {
      const mockResult = {
        cart_id: 1,
        user_id: 'user-1',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z'
      };
      mockDb.get.mockResolvedValue(mockResult);

      const result = await repository.findById(1);

      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM carts WHERE cart_id = ?', [1]);
      expect(result?.cartId).toBe(1);
      expect(result?.userId).toBe('user-1');
    });

    it('should return null when cart not found', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return cart when found by user ID', async () => {
      const mockResult = {
        cart_id: 1,
        user_id: 'user-1',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z'
      };
      mockDb.get.mockResolvedValue(mockResult);

      const result = await repository.findByUserId('user-1');

      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM carts WHERE user_id = ?', ['user-1']);
      expect(result?.cartId).toBe(1);
    });

    it('should return null when no cart for user', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const result = await repository.findByUserId('nonexistent-user');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new cart and return it', async () => {
      const newCart = { userId: 'user-2' };

      mockDb.run.mockResolvedValue({ lastID: 2, changes: 1 });
      mockDb.get.mockResolvedValue({
        cart_id: 2,
        user_id: 'user-2',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z'
      });

      const result = await repository.create(newCart);

      expect(mockDb.run).toHaveBeenCalled();
      expect(result.cartId).toBe(2);
      expect(result.userId).toBe('user-2');
    });
  });

  describe('delete', () => {
    it('should delete existing cart', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      await repository.delete(1);

      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM carts WHERE cart_id = ?', [1]);
    });

    it('should throw NotFoundError when cart does not exist', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      await expect(repository.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('exists', () => {
    it('should return true when cart exists', async () => {
      mockDb.get.mockResolvedValue({ count: 1 });

      const result = await repository.exists(1);

      expect(result).toBe(true);
    });

    it('should return false when cart does not exist', async () => {
      mockDb.get.mockResolvedValue({ count: 0 });

      const result = await repository.exists(999);

      expect(result).toBe(false);
    });
  });
});
