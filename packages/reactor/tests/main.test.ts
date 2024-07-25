import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { modifyHtml } from "../main";

// Set up a mock DOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document;
// biome-ignore lint/suspicious/noExplicitAny: testing
global.window = dom.window as any;

describe("modifyHtml", () => {
	it("should replace text content", async () => {
		const html = `<div id="user-info">Eliza Hart</div>`;
		const userRequest = JSON.stringify({
			description: "Change the name 'Eliza' to 'Santiago'.",
			modifications: [
				{
					selector: "#user-info",
					action: "replace",
					content: "Santiago Hart",
				},
			],
		});

		const result = await modifyHtml(html, userRequest);
		expect(result).toContain("Santiago Hart");
	});

	it("should swap image source", async () => {
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

	it("should highlight an element", async () => {
		const html = `<div id="highlight-me">Highlight me!</div>`;
		const userRequest = JSON.stringify({
			description: "Highlight the element.",
			modifications: [
				{
					selector: "#highlight-me",
					action: "highlight",
					highlightStyle: "2px dashed blue",
				},
			],
		});

		const result = await modifyHtml(html, userRequest);
		expect(result).toContain('style="border: 2px dashed blue;"');
	});

	it("should create a toast notification", async () => {
		const html = "<body></body>";
		const userRequest = JSON.stringify({
			description: "Create a toast notification.",
			modifications: [
				{
					selector: "body",
					action: "toast",
					toastMessage: "This is a toast message",
				},
			],
		});

		const result = await modifyHtml(html, userRequest);
		expect(result).toContain("This is a toast message");
	});

	it("should add a DaisyUI component", async () => {
		const html = `<div id="user-info">Eliza Hart</div>`;
		const userRequest = JSON.stringify({
			description: "Add a DaisyUI card component.",
			modifications: [
				{
					selector: "#user-info",
					action: "addComponent",
					componentHtml: `
            <div class="card w-96 bg-base-100 shadow-xl">
              <div class="card-body">
                <h2 class="card-title">New Card</h2>
                <p>If a dog chews shoes whose shoes does he choose?</p>
                <div class="card-actions justify-end">
                  <button class="btn btn-primary">Buy Now</button>
                </div>
              </div>
            </div>
          `,
				},
			],
		});

		const result = await modifyHtml(html, userRequest);
		expect(result).toContain('class="card w-96 bg-base-100 shadow-xl"');
	});

	it("should handle multiple modifications", async () => {
		const html = `
      <div id="user-info">Eliza Hart</div>
      <div id="welcome-message">Welcome, Eliza!</div>
      <img id="profile-pic" src="eliza.jpg" />
    `;
		const userRequest = JSON.stringify({
			description:
				"Change all occurrences of the name 'Eliza' to 'Santiago', swap profile picture, and add a toast notification.",
			modifications: [
				{
					selector: "#user-info",
					action: "replace",
					content: "Santiago Hart",
				},
				{
					selector: "#welcome-message",
					action: "replace",
					content: "Welcome, Santiago!",
				},
				{
					selector: "#profile-pic",
					action: "swapImage",
					imageUrl: "santiago.jpg",
				},
				{
					selector: "body",
					action: "toast",
					toastMessage: "Welcome to the new site, Santiago!",
				},
			],
		});

		const result = await modifyHtml(html, userRequest);
		expect(result).toContain("Santiago Hart");
		expect(result).toContain("Welcome, Santiago!");
		expect(result).toContain('src="santiago.jpg"');
		expect(result).toContain("Welcome to the new site, Santiago!");
	});

	it("should handle missing elements gracefully", async () => {
		const html = "<div>Some content</div>";
		const userRequest = JSON.stringify({
			description: "Try to modify a non-existent element",
			modifications: [
				{
					selector: "#non-existent",
					action: "replace",
					content: "This should not appear",
				},
			],
		});

		const result = await modifyHtml(html, userRequest);
		expect(result).not.toContain("This should not appear");
		expect(result).toContain("<div>Some content</div>");
	});
	it("should be able to update timestamps", async () => {
		const html = `
			<div id="container">
				<div data-column-id="issueCreatedAt">
					<span id="dateSpn" aria-label="Created Jun 17, 7:01:42 PM">Jun 17</span>
				</div>
			</div>`;

		const userRequest = JSON.stringify({
			description: "Update timestamp references",
			modifications: [
				{
					selector: "#container",
					action: "updateTimestampReferences",
					timestampRef: {
						recordedAt: "2021-06-17T19:01:42Z",
						currentTime: "2021-06-20T19:01:42Z",
					},
				},
			],
		});

		const result = await modifyHtml(html, userRequest);

		const domResult = new JSDOM(result);
		const dateSpn = domResult.window.document.querySelector("#dateSpn");
		expect(dateSpn).not.toBeNull();
		expect(dateSpn?.textContent).toBe("Jun 20");
		expect(dateSpn?.getAttribute("aria-label")).toBe(
			"Created Jun 20, 7:01:42 PM",
		);
	});
});
