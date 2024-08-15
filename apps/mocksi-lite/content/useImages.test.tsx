import { afterEach } from "node:test";
import { act, renderHook, screen } from "@testing-library/react";
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

		expect(result.current.edits).toStrictEqual([]);
		act(() => result.current.setEdits(["https://test.com/img"]));
		expect(result.current.edits).toEqual(["https://test.com/img"]);
	});

	it("edit dom", async () => {
		const img = document.createElement("img");
		img.src = "https://example.com";
		img.alt = "example image";
		document.body.appendChild(img);

		const { result } = renderHook(useImages);
		act(() =>
			result.current.createEdit("https://example.com", "https://dogs.com"),
		);
		expect(result.current.edits).toHaveLength(1);
	});
});
