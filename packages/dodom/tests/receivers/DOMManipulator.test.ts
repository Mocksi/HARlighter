import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DOMManipulator } from "../../receivers/DOMManipulator";
import { replaceFirstLetterCase } from "../../receivers/DOMManipulator";

const mockFragmentTextNode = vi.fn();
const mockContentHighlighter = {
	highlightNode: vi.fn(),
	removeHighlightNode: vi.fn(),
};
const mockSaveModification = vi.fn();
global.MutationObserver = vi.fn(function MutationObserver(callback) {
	return {
		observe: vi.fn(),
		disconnect: vi.fn(),
		takeRecords: vi.fn(),
		callback,
	};
});

describe("DOMManipulator", () => {
	let domManipulator: DOMManipulator;

	beforeEach(() => {
		domManipulator = new DOMManipulator(
			mockFragmentTextNode,
			mockContentHighlighter,
			mockSaveModification,
		);
		vi.spyOn(domManipulator, "matchReplacePattern");
		vi.spyOn(domManipulator, "handleMutations");
		vi.spyOn(domManipulator, "handleMutation");
		vi.spyOn(domManipulator, "handleAddedNode");
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should add a pattern and call seekAndReplace", () => {
		const pattern = "test";
		const replace = "replace";

		vi.spyOn(domManipulator, "seekAndReplaceAllPage");

		domManipulator.addPattern(pattern, replace);

		expect(domManipulator.seekAndReplaceAllPage).toHaveBeenCalledWith(
			expect.any(RegExp),
			replace,
		);
		expect(domManipulator.getPatternCount()).toBe(1);
	});

	it("should remove a pattern", () => {
		const pattern = "test";
		const replace = "replace";

		domManipulator.addPattern(pattern, replace);
		domManipulator.removePattern(pattern);

		expect(domManipulator.getPatternCount()).toBe(0);
	});

	it("should match replace pattern", () => {
		const pattern = "test";
		const replace = "replace";

		domManipulator.addPattern(pattern, replace);

		const match = domManipulator.matchReplacePattern("test string");

		expect(match).not.toBeNull();
		expect(match?.pattern).toEqual(new RegExp(pattern, "ig"));
		expect(match?.replace).toBe(replace);
	});

	describe("createObserver", () => {
		it("should handle mutations", () => {
			// biome-ignore lint/suspicious/noExplicitAny: This is a test
			const mutations: MutationRecord[] = [{ addedNodes: [] } as any];
			domManipulator.handleMutations(mutations);
			expect(domManipulator.handleMutation).toHaveBeenCalled();
		});

		it("should handle added nodes", () => {
			const node = document.createTextNode("test");
			domManipulator.handleAddedNode(node);
			expect(domManipulator.matchReplacePattern).toHaveBeenCalledWith("test");
		});
	});
});

describe("replaceFirstLetterCase", () => {
	it("should replace with capitalized first letter when match is capitalized", () => {
		const replacer = replaceFirstLetterCase("replacement");
		const result = replacer("Match");
		expect(result).toBe("Replacement");
	});

	it("should replace with lowercase first letter when match is lowercase", () => {
		const replacer = replaceFirstLetterCase("Replacement");
		const result = replacer("match");
		expect(result).toBe("Replacement");
	});

	it("should handle single character matches", () => {
		const replacer = replaceFirstLetterCase("x");
		const resultUpperCase = replacer("A");
		const resultLowerCase = replacer("a");
		expect(resultUpperCase).toBe("X");
		expect(resultLowerCase).toBe("x");
	});

	it("should handle matches that include special characters", () => {
		const replacer = replaceFirstLetterCase("replacement!");
		const result = replacer("Match!");
		expect(result).toBe("Replacement!");
	});

	it("should handle matches with mixed case", () => {
		const replacer = replaceFirstLetterCase("rePLACement");
		const result = replacer("MaTcH");
		expect(result).toBe("RePLACement");
	});

	it("should return the replacement value as is when match is empty", () => {
		const replacer = replaceFirstLetterCase("replacement");
		const result = replacer("");
		expect(result).toBe("replacement");
	});

	it("should handle replacement values that start with special characters", () => {
		const replacer = replaceFirstLetterCase("@replacement");
		const resultUpperCase = replacer("Match");
		const resultLowerCase = replacer("match");
		expect(resultUpperCase).toBe("@replacement");
		expect(resultLowerCase).toBe("@replacement");
	});

	it("should not modify the replacement value for non-alphabetical matches", () => {
		const replacer = replaceFirstLetterCase("replacement");
		const result = replacer("1234");
		expect(result).toBe("replacement");
	});

	it("should handle replacement values with mixed case", () => {
		const replacer = replaceFirstLetterCase("rEPLACement");
		const resultUpperCase = replacer("Match");
		const resultLowerCase = replacer("match");
		expect(resultUpperCase).toBe("REPLACement");
		expect(resultLowerCase).toBe("rEPLACement");
	});

	it("should return the replacement value when match is a single special character", () => {
		const replacer = replaceFirstLetterCase("replacement");
		const result = replacer("#");
		expect(result).toBe("replacement");
	});
});
