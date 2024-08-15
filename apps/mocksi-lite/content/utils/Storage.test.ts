import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStorage } from './Storage'

const TEST_STORAGE_KEY = 'test-storage-key';
const TEST_TAB_ID = 'test-tab-id';

describe('Storage', () => {
  const mockSet = vi.fn();
  const mockGet = vi.fn();
  const mockRemove = vi.fn();
  const mockStore = {
    get: mockGet,
    set: mockSet,
    remove: mockRemove,
  }

  let storage = createStorage(mockStore);

  beforeEach(() => {
    mockSet.mockClear();
    mockGet.mockClear();
    mockRemove.mockClear();

    storage = createStorage(mockStore);
  })

  describe('setItem', () => {
    beforeEach(() => {
      storage.tabId = TEST_TAB_ID;
    })

    it('should set item for a specific tab id', async () => {
      const testValue = 'test-value-1';
      const result = await storage.setItem({ [TEST_STORAGE_KEY]: testValue })

      expect(result).toBe(true);
      expect(mockSet).toBeCalledWith({ [TEST_TAB_ID]: { [TEST_STORAGE_KEY]: testValue } });
    })
  })
})