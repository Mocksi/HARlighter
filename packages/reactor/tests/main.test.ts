import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { ModificationRequest } from "../interfaces";
import { modifyHtml, modifyDom } from "../main";
import { AppliedModificationsImpl } from '../utils';

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

	it.skip("Should replace all with a regular expression", async () => {
		const htmlString = `<html><body><h1 id="title">Train test</h1><div><div>Some text content here about a train</div><h2>About the train</h2><div>Trains are really cool. I use my train every day.</div></div></body></html/>`;
		const userRequest = JSON.stringify({
			description: "Change train to brain",
			modifications: [
				{
					xpath: "//html/body/div",
					action: "replaceAll",
					content: "/train/brain/",
				},
			],
		});
		const result = await modifyHtml(htmlString, userRequest);

		const parser = new DOMParser();
		const doc = parser.parseFromString(result, "text/html");

		const unmodified = document.evaluate(
			"//html/body/h1/text()[1]",
			doc,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null,
		).singleNodeValue;
		expect(unmodified?.textContent).toBe("Train test");

		const modified = document.evaluate(
			"//html/body/div/div/text()[1]",
			doc,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null,
		).singleNodeValue;
		expect(modified?.textContent).toBe("Some text content here about a brain");

		const modified2 = document.evaluate(
			"//html/body/div/h2/text()[1]",
			doc,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null,
		).singleNodeValue;
		expect(modified2?.textContent).toBe("About the brain");

		const modified3 = document.evaluate(
			"//html/body/div/div[2]/text()[1]",
			doc,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null,
		).singleNodeValue;
		expect(modified3?.textContent).toBe(
			"Brains are really cool. I use my brain every day.",
		);
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

	it("should handle multiple modifications using modifyDom", async () => {
		const htmlString = `
      		<div id="user-info">Eliza Hart</div>
      		<div id="welcome-message">Welcome, Eliza!</div>
	  		<img id="profile-pic" src="eliza.jpg" />
    	`;

		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, "text/html");

		const userRequest: ModificationRequest = {
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
		};

		await modifyDom(doc, userRequest);

		expect(doc.body.innerHTML).toContain("Santiago Hart");
		expect(doc.body.innerHTML).toContain("Welcome, Santiago!");
		expect(doc.body.innerHTML).toContain('src="santiago.jpg"');
		expect(doc.body.innerHTML).toContain("Welcome to the new site, Santiago!");
	});

	it("should unapply multiple modifications using modifyDom", async () => {
		const htmlString = `
      		<div id="user-info">Eliza Hart</div>
      		<div id="welcome-message">Welcome, Eliza!</div>
	  		<img id="profile-pic" src="eliza.jpg" />
    	`;

		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, "text/html");

		const userRequest: ModificationRequest = {
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
		};

		const modifications = await modifyDom(doc, userRequest) as AppliedModificationsImpl;
		modifications.unapply();

		expect(doc.body.innerHTML).toContain("Eliza Hart");
		expect(doc.body.innerHTML).toContain("Welcome, Eliza!");
		expect(doc.body.innerHTML).toContain('src="eliza.jpg"');
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
});
