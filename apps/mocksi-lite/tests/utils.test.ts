import { describe, expect, it, vi } from "vitest";
import { extractStyles } from "../utils";

// Mock CSSStyleRule
class MockCSSStyleRule {
	cssText: string;
	style: { getPropertyValue: (prop: string) => string };

	constructor(cssText: string, include: boolean) {
		this.cssText = cssText;
		this.style = {
			getPropertyValue: (prop: string) =>
				prop === "--mcksi-frame-include" && include ? "true" : "",
		};
	}
}

describe("extractStyles", () => {
	it('should extract styles from the stylesheets that contain the "--mcksi-frame-include: true;" rule', () => {
		// Mock CSSStyleSheet and CSSRule
		const mockCSSRule = (cssText: string, include: boolean): CSSRule =>
			new MockCSSStyleRule(cssText, include) as unknown as CSSRule;

		const mockCSSStyleSheet = (
			href: string | null,
			rules: CSSRule[],
		): CSSStyleSheet =>
			({
				href,
				cssRules: rules,
			}) as unknown as CSSStyleSheet;

		// Create mock stylesheets
		const stylesheets = [
			mockCSSStyleSheet(null, [mockCSSRule("body { color: red; }", true)]),
			mockCSSStyleSheet(null, [mockCSSRule("body { color: blue; }", false)]),
			mockCSSStyleSheet("http://example.com/style.css", [
				mockCSSRule("body { color: green; }", true),
			]),
			mockCSSStyleSheet(null, [mockCSSRule("body { color: yellow; }", true)]),
			mockCSSStyleSheet(null, [mockCSSRule("body { color: black; }", true)]),
			mockCSSStyleSheet(null, [mockCSSRule("body { color: white; }", true)]),
		];

		// Call the function
		const result = extractStyles(
			stylesheets as unknown as DocumentOrShadowRoot["styleSheets"],
		);

		// Assert the result
		expect(result).toContain("body { color: red; }");
		expect(result).toContain("body { color: yellow; }");
		expect(result).toContain("body { color: black; }");
		expect(result).toContain("body { color: white; }");
		expect(result).not.toContain("body { color: blue; }");
		expect(result).not.toContain("body { color: green; }");
	});

	it("should handle errors gracefully", () => {
		// Mock CSSStyleSheet and CSSRule
		const mockCSSStyleSheetWithError = (): CSSStyleSheet =>
			({
				href: null,
				get cssRules() {
					throw new Error("Access denied");
				},
			}) as unknown as CSSStyleSheet;

		// Create mock stylesheets
		const stylesheets = [mockCSSStyleSheetWithError()];

		// Spy on console.error
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		// Call the function
		const result = extractStyles(
			stylesheets as unknown as DocumentOrShadowRoot["styleSheets"],
		);

		// Assert the result
		expect(result).toBe("");
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Error accessing stylesheet:",
			expect.any(Error),
		);

		// Restore console.error
		consoleErrorSpy.mockRestore();
	});
});
