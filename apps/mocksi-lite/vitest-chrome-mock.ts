import { vi } from "vitest";

const ChromeStorageLocalMock = vi.fn(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.stubGlobal("chrome.storage.local", ChromeStorageLocalMock);
