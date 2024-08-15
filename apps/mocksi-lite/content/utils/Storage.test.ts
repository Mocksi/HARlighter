import { beforeEach, describe, it, vi } from 'vitest'
import { createStorage } from './Storage'

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
      storage.tabId = 'test-tab-id';
    })

    it('should set item for a specific tab id', () => {
      const result = 
    })
  })
})