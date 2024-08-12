import "@testing-library/jest-dom";
import { afterEach } from "node:test";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useImages from "./useImages";

describe("useImages hook", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	// TODO: expand on or remove test
	it("sets image state (trivial example just to get tests going)", async () => {
		const img = document.createElement("img");
		img.src = "https://example.com";
		document.body.appendChild(img);

		expect(document.body.childElementCount).toBe(1);

		const { result } = renderHook(useImages);
		expect(result.current.edits).toStrictEqual({});

		const imageEditRecord = {
			demoSrc: "https://test.com/img",
			index: "1",
			originalSrc: "https://example.com/assets/cat-img",
		};

		act(() =>
			result.current.setEdits({
				[1]: imageEditRecord,
			}),
		);

		expect(result.current.edits).toEqual({
			[1]: imageEditRecord,
		});
	});

	it("handles empty chrome storage gracefully", async () => {
		const { result } = renderHook(useImages);
		const edits = await result.current.getStoredEdits();
		expect(edits).toBeUndefined();
	});
});
