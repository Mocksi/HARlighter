import "@testing-library/jest-dom/vitest";
import { JSDOM } from "jsdom";
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

global.document = window.document;
