import { JSDOM } from "jsdom";
import { describe, expect, it, beforeEach } from "vitest";
import type { ModificationRequest } from "../interfaces";
import { modifyDom, modifyHtml, htmlElementToJson } from "../main";
import type { AppliedModificationsImpl } from "../modifications";

describe("modifyHtml", () => {
	let doc: Document;

	// Vitest beforeEach function for setup
	beforeEach(() => {
		doc = window.document.implementation.createHTMLDocument("Test Document");
	});

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

	it("Should replace all with a regular expression", async () => {
		const htmlString = `<html><body><h1 id="title">Train test</h1><div><div>Some text content here about a train</div><h2>About the train</h2><div>Trains are really cool. I use my train every day.</div></div></body></html/>`;
		const userRequest = JSON.stringify({
			description: "Change train to brain",
			modifications: [
				{
					xpath: "//html/body/div",
					action: "replaceAll",
					content: "/train/brain/i",
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

		const modifications = (await modifyDom(
			doc,
			userRequest,
		)) as AppliedModificationsImpl;
		modifications.unapply();

		expect(doc.body.innerHTML).toContain("Eliza Hart");
		expect(doc.body.innerHTML).toContain("Welcome, Eliza!");
		expect(doc.body.innerHTML).toContain('src="eliza.jpg"');
	});

	it("should unapply a remove of multiple elements correctly", async () => {
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
					action: "remove",
				},
				{
					selector: "#welcome-message",
					action: "remove",
				},
				{
					selector: "#profile-pic",
					action: "remove",
				},
			],
		};

		const modifications = (await modifyDom(
			doc,
			userRequest,
		)) as AppliedModificationsImpl;
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

	it("should ignore invalid selectors", async () => {
		const html = "<p>Old content</p>";
		const userRequest = JSON.stringify({
			description: "Try to modify an element with a bad selector",
			modifications: [
				{
					action: "replace",
					content: "<p>New Content</p>",
					selector: "#;3s92hn",
				},
			],
		});

		const result = await modifyHtml(html, userRequest);
		expect(result).not.toContain("<p>New content</p>");
		expect(result).toContain("<p>Old content</p>");
	});

	it('should convert a simple HTML element to JSON', async () => {
		doc.body.innerHTML = '<div id="test" class="example">Hello World!</div>';
		const json = htmlElementToJson(doc.body);
	
		expect(json).toEqual([
		  {
			tag: 'div',
			visible: false,
			attributes: {
			  id: 'test',
			  class: 'example',
			},
			text: 'Hello World!',
		  },
		]);
	  });
	
	  it('should handle nested HTML elements', async () => {
		doc.body.innerHTML = '<div id="test"><p>Hello</p><span>World!</span></div>';
		const json = htmlElementToJson(doc.body);
	
		expect(json).toEqual([
		  {
			tag: 'div',
			visible: false,
			attributes: {
			  id: 'test',
			},
			children: [
			  {
				attributes: {},
				tag: 'p',
				visible: false,
				text: 'Hello',
			  },
			  {
				attributes: {},
				tag: 'span',
				visible: false,
				text: 'World!',
			  },
			],
		  },
		]);
	  });

	  it('should export styles when the option is set', async () => {
		doc.body.innerHTML = '<div id="test" style="color: red; font-size: 24px;">Hello World!</div>';
		const json = htmlElementToJson(doc.body, {styles: true});
	
		expect(json).toEqual([
		  {
			tag: 'div',
			visible: false,
			attributes: {
			  class: 'mocksi-1',
			  id: 'test',
			  style: 'color: red; font-size: 24px;',
			},
			text: 'Hello World!',
		  },
		  {
			attributes: {},
			tag: "style",
			text: ".mocksi-1 { display: block; color: rgb(255, 0, 0); font-size: 24px; visibility: visible; pointer-events: auto; background-color: rgba(0, 0, 0, 0); border-block-start-color: rgb(255, 0, 0); border-block-end-color: rgb(255, 0, 0); border-inline-start-color: rgb(255, 0, 0); border-inline-end-color: rgb(255, 0, 0); border-top-color: rgb(255, 0, 0); border-right-color: rgb(255, 0, 0); border-bottom-color: rgb(255, 0, 0); border-left-color: rgb(255, 0, 0); caret-color: auto }",
			visible: false
		  }
		]);
	  });

	  it('should consolidate styles when they are the same', async () => {
		doc.body.innerHTML = '<div id="test" style="color: red; font-size: 24px;">Hello World!</div><div id="test" style="color: red; font-size: 24px;">Hello World!</div>';
		const json = htmlElementToJson(doc.body, {styles: true});
	
		expect(json).toEqual([
		  {
			tag: 'div',
			visible: false,
			attributes: {
			  class: 'mocksi-1',
			  id: 'test',
			  style: 'color: red; font-size: 24px;',
			},
			text: 'Hello World!',
		  },
		  {
			tag: 'div',
			visible: false,
			attributes: {
			  class: 'mocksi-1',
			  id: 'test',
			  style: 'color: red; font-size: 24px;',
			},
			text: 'Hello World!',
		  },
		  {
			attributes: {},
			tag: "style",
			text: ".mocksi-1 { display: block; color: rgb(255, 0, 0); font-size: 24px; visibility: visible; pointer-events: auto; background-color: rgba(0, 0, 0, 0); border-block-start-color: rgb(255, 0, 0); border-block-end-color: rgb(255, 0, 0); border-inline-start-color: rgb(255, 0, 0); border-inline-end-color: rgb(255, 0, 0); border-top-color: rgb(255, 0, 0); border-right-color: rgb(255, 0, 0); border-bottom-color: rgb(255, 0, 0); border-left-color: rgb(255, 0, 0); caret-color: auto }",
			visible: false
		  }
		]);
	  });
});
