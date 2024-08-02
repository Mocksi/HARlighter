import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DOMManipulator } from "../../receivers/DOMManipulator";
import { replaceFirstLetterCase, cleanPattern } from "../../receivers/DOMManipulator";

const mockFragmentTextNode = vi.fn((fragmentsToHighlight, matches, textNode, newText) => {
	const fragment = document.createDocumentFragment();
	const span = document.createElement("span");
	span.textContent = textNode.nodeValue?.replace(matches[0][0], newText) || "";
	fragment.appendChild(span);
	return fragment;
});
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

	it("should replace 'engineering' with 'marketing' in the given HTML snippet", () => {
		document.body.innerHTML = `
			<a class="flex-1 overflow-hidden pr-4 text-sm" title="15 Min Meeting" href="/event-types/1?tabName=setup">
				<div>
					<span class="font-semibold text-gray-700 ltr:mr-1 rtl:ml-1" data-testid="event-type-title-1">15 Min Meeting</span>
					<small class="hidden font-normal leading-4 text-gray-600 sm:inline" data-testid="event-type-slug-1">/engineering/15min</small>
				</div>
				<div class="dark:text-darkgray-800 text-gray-500">
					<ul class="mt-2 flex flex-wrap space-x-2 rtl:space-x-reverse">
						<li>
							<div class="font-medium inline-flex items-center justify-center rounded gap-x-1 bg-gray-100 text-gray-800 dark:bg-darkgray-200 dark:text-darkgray-800 group-hover:bg-gray-200 dark:group-hover:bg-darkgray-300 py-1 px-1.5 text-xs leading-3">
								<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 stroke-[3px]" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
									<circle cx="12" cy="12" r="10"></circle>
									<polyline points="12 6 12 12 16 14"></polyline>
								</svg>
								<div>15m</div>
							</div>
						</li>
					</ul>
				</div>
			</a>
		`;
		domManipulator.addPattern("engineering", "marketing");

		const smallElement = document.querySelector('[data-testid="event-type-slug-1"]');
		expect(smallElement?.textContent).toBe("/marketing/15min");
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

describe("cleanPattern", () => {
	it("should correctly clean the pattern '/engineering/gi'", () => {
		const pattern = /engineering/gi;
		const cleaned = cleanPattern(pattern);
		expect(cleaned).toBe("engineering");
	});

	it("should correctly clean the pattern '/test/'", () => {
		const pattern = /test/;
		const cleaned = cleanPattern(pattern);
		expect(cleaned).toBe("test");
	});

	it("should correctly clean the pattern '/example/g'", () => {
		const pattern = /example/g;
		const cleaned = cleanPattern(pattern);
		expect(cleaned).toBe("example");
	});

	it("should correctly clean the pattern '/sample/i'", () => {
		const pattern = /sample/i;
		const cleaned = cleanPattern(pattern);
		expect(cleaned).toBe("sample");
	});
});