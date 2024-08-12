import * as matchers from "@testing-library/jest-dom/matchers";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { afterEach, expect } from "vitest";
import { vi } from "vitest";

const ChromeMock = {
  storage: {
    local: {
      get: vi.fn().mockImplementation((storage) => {
        return storage;
      }),
      set: vi.fn().mockImplementation((storage) => {
        return storage;
      }),
    },
  },
};

vi.stubGlobal("chrome", ChromeMock);

const jsdom = new JSDOM("<!doctype html><html><body></body></html>");
const { window } = jsdom;

global.window = window as typeof globalThis;
global.jsdom = jsdom;
