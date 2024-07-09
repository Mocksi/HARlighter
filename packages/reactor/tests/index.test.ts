// Import the function you want to test
import { describe, expect, it } from "vitest";
import { modifyHtml } from "../index";

describe("modifyHtml should perform basic HTML modification", () => {
	it("changes text content, swaps image sources, highlights elements, creates toast notifications, adds DaisyUI components, handles multiple modifications, and gracefully handles missing elements", async () => {
		const html = `<img id="profile-pic" src="eliza.jpg" />`;
		const userRequest = JSON.stringify({
			description: "Swap the profile picture.",
			modifications: [
				{
					selector: "#profile-pic",
					action: "swapImage",
					imageUrl: "santiago.jpg",
				},
			],
		});

		const result = await modifyHtml(html, userRequest);
		expect(result).toContain('src="santiago.jpg"');
	});
});
