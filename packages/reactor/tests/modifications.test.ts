import { beforeEach, describe, expect, it } from "vitest";
import { extendExpect } from "./test.utils";
import type { Modification, ModificationRequest } from "../interfaces";
import { applyModification, generateModifications } from "../modifications";
import { createToast } from "../modifications/toast";

extendExpect(expect);

describe("Utils", () => {
	let doc: Document;

	// Vitest beforeEach function for setup
	beforeEach(() => {
		doc = document.implementation.createHTMLDocument("Test Document");
	});

	describe("applyModification", () => {
		it("should replace content correctly", async () => {
			const modification: Modification = {
				action: "replace",
				content: "<p>New Content</p>",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			element.innerHTML = "<p>Old Content</p>";
			await applyModification(element, modification, doc);

			expect(element.innerHTML).toBe("<p>New Content</p>");
		});

		it("should unapply replaced content correctly", async () => {
			const modification: Modification = {
				action: "replace",
				content: "<p>New Content</p>",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			element.innerHTML = "<p>Old Content</p>";
			const modifications = await applyModification(element, modification, doc);
			modifications.unapply();

			expect(element.innerHTML).toBe("<p>Old Content</p>");
		});

		it("should replace all content correctly", async () => {
			const modification: Modification = {
				action: "replaceAll",
				content: "/old/new/",
			};

			const element = doc.createElement("div");
			doc.body.appendChild(element);
			element.innerHTML = "<p>Old Content</p>";
			await applyModification(element, modification, doc);

			expect(element.innerHTML).toMatchIgnoringMocksiTags("<p>New Content</p>");
		});

		it("should unapply replace all correctly", async () => {
			const modification: Modification = {
				action: "replaceAll",
				content: "/old/new/",
			};

			const element = doc.createElement("div");
			doc.body.appendChild(element);
			element.innerHTML = "<p>Old Content</p>";
			const modifications = await applyModification(element, modification, doc);
			modifications.unapply();

			expect(element.innerHTML).toMatchIgnoringMocksiTags("<p>Old Content</p>");
		});

		it("should preserve capitals in replacement", async () => {
			const modification: Modification = {
				action: "replaceAll",
				content: "/old/new/",
			};

			const element = doc.createElement("div");
			doc.body.appendChild(element);
			element.innerHTML = "<p>Old Content is old</p>";
			await applyModification(element, modification, doc);

			expect(element.innerHTML).toMatchIgnoringMocksiTags("<p>New Content is new</p>");
		});

		it("should preserve plurals in replacement", async () => {
			const modification: Modification = {
				action: "replaceAll",
				content: "/train/brain/",
			};

			const element = doc.createElement("div");
			doc.body.appendChild(element);
			element.innerHTML = "<p>Trains are great! I love my train.</p>";
			await applyModification(element, modification, doc);

			expect(element.innerHTML).toMatchIgnoringMocksiTags(
				"<p>Brains are great! I love my brain.</p>",
			);
		});

		it("should only replace whole words", async () => {
			const modification: Modification = {
				action: "replaceAll",
				content: "/train/brain/",
			};

			const element = doc.createElement("div");
			doc.body.appendChild(element);
			element.innerHTML =
				"<p>I was in training about trains, but it was a strain to train.</p>";
			await applyModification(element, modification, doc);

			expect(element.innerHTML).toMatchIgnoringMocksiTags(
				"<p>I was in training about brains, but it was a strain to brain.</p>",
			);
		});

		it("should handle more complicated HTML", async () => {
			const modification: Modification = {
				action: "replaceAll",
				content: "/train/brain/",
			};

			const element = doc.createElement("div");
			doc.body.appendChild(element);
			element.innerHTML =
				'<h1>Trains</h1><p>Trains are great! <a href="train.jpg">A picture of a <i>train</i></a></p><p>Trains are great! I love my train.</p>';
			await applyModification(element, modification, doc);

			expect(element.innerHTML).toMatchIgnoringMocksiTags(
				'<h1>Brains</h1><p>Brains are great! <a href="train.jpg">A picture of a <i>brain</i></a></p><p>Brains are great! I love my brain.</p>',
			);
		});

		it("should unapply replaceall properly on more complicated HTML", async () => {
			const modification: Modification = {
				action: "replaceAll",
				content: "/train/brain/",
			};

			const element = doc.createElement("div");
			doc.body.appendChild(element);
			element.innerHTML =
				'<h1>Trains</h1><p>Trains are great! <a href="train.jpg">A picture of a <i>train</i></a></p><p>Trains are great! I love my train.</p>';
			const modifications = await applyModification(element, modification, doc);
			modifications.unapply();

			expect(element.innerHTML).toMatchIgnoringMocksiTags(
				'<h1>Trains</h1><p>Trains are great! <a href="train.jpg">A picture of a <i>train</i></a></p><p>Trains are great! I love my train.</p>',
			);
		});

		it("should work with multiple text nodes", async () => {
			const modification: Modification = {
				action: "replaceAll",
				content: "/train/brain/",
			};

			const element = doc.createElement("div");
			doc.body.appendChild(element);
			const t1 = doc.createTextNode("Trains node 1 ");
			const t2 = doc.createTextNode("Trains node 2 ");
			const t3 = doc.createTextNode("Trains node 3");
			element.appendChild(t1);
			element.appendChild(t2);
			element.appendChild(t3);

			await applyModification(element, modification, doc);

			expect(element.innerHTML).toBe(
				"Brains node 1 Brains node 2 Brains node 3",
			);
		});

		it("should work with wikipedia", async() => {
			const modification: Modification = {
				action: "replaceAll",
				content: "/Thailand/Russia/",
			};

			const element = doc.createElement("p");
			element.innerHTML = "<p>The office of the \"President of the <a href=\"/wiki/People%27s_Committee_of_Siam\" title=\"People's Committee of Siam\">People's Committee</a>\" (<span title=\"Thai-language text\"><span lang=\"th\">ประธานคณะกรรมการราษฎร</span></span>), later changed to \"Prime Minister of Siam\" (<span title=\"Thai-language text\"><span lang=\"th\">นายกรัฐมนตรีสยาม</span></span>), was first created in the <a href=\"/wiki/Constitution_of_Thailand#1932_Temporary_Charter\" title=\"Constitution of Thailand\">Temporary Constitution of 1932</a>. The office was modeled after the <a href=\"/wiki/Prime_Minister_of_the_United_Kingdom\" title=\"Prime Minister of the United Kingdom\">prime minister of the United Kingdom</a>, as Siam became a <a href=\"/wiki/Parliamentary_democracy\" class=\"mw-redirect\" title=\"Parliamentary democracy\">parliamentary democracy</a> in 1932 after a <a href=\"/wiki/Siamese_revolution_of_1932\" title=\"Siamese revolution of 1932\">bloodless revolution</a>. However, the idea of a separate head of government in Thailand is not new.</p>"
			doc.body.appendChild(element);
		
			await applyModification(doc.body, modification, doc);

			expect(element.innerHTML).toMatchIgnoringMocksiTags("<p>The office of the \"President of the <a href=\"/wiki/People%27s_Committee_of_Siam\" title=\"People's Committee of Siam\">People's Committee</a>\" (<span title=\"Thai-language text\"><span lang=\"th\">ประธานคณะกรรมการราษฎร</span></span>), later changed to \"Prime Minister of Siam\" (<span title=\"Thai-language text\"><span lang=\"th\">นายกรัฐมนตรีสยาม</span></span>), was first created in the <a href=\"/wiki/Constitution_of_Thailand#1932_Temporary_Charter\" title=\"Constitution of Thailand\">Temporary Constitution of 1932</a>. The office was modeled after the <a href=\"/wiki/Prime_Minister_of_the_United_Kingdom\" title=\"Prime Minister of the United Kingdom\">prime minister of the United Kingdom</a>, as Siam became a <a href=\"/wiki/Parliamentary_democracy\" class=\"mw-redirect\" title=\"Parliamentary democracy\">parliamentary democracy</a> in 1932 after a <a href=\"/wiki/Siamese_revolution_of_1932\" title=\"Siamese revolution of 1932\">bloodless revolution</a>. However, the idea of a separate head of government in Russia is not new.</p>");
		});

		it("should unapply from wikipedia", async() => {
			const modification: Modification = {
				action: "replaceAll",
				content: "/Thailand/Russia/",
			};

			const element = doc.createElement("p");
			element.innerHTML = "<p>The office of the \"President of the <a href=\"/wiki/People%27s_Committee_of_Siam\" title=\"People's Committee of Siam\">People's Committee</a>\" (<span title=\"Thai-language text\"><span lang=\"th\">ประธานคณะกรรมการราษฎร</span></span>), later changed to \"Prime Minister of Siam\" (<span title=\"Thai-language text\"><span lang=\"th\">นายกรัฐมนตรีสยาม</span></span>), was first created in the <a href=\"/wiki/Constitution_of_Thailand#1932_Temporary_Charter\" title=\"Constitution of Thailand\">Temporary Constitution of 1932</a>. The office was modeled after the <a href=\"/wiki/Prime_Minister_of_the_United_Kingdom\" title=\"Prime Minister of the United Kingdom\">prime minister of the United Kingdom</a>, as Siam became a <a href=\"/wiki/Parliamentary_democracy\" class=\"mw-redirect\" title=\"Parliamentary democracy\">parliamentary democracy</a> in 1932 after a <a href=\"/wiki/Siamese_revolution_of_1932\" title=\"Siamese revolution of 1932\">bloodless revolution</a>. However, the idea of a separate head of government in Thailand is not new.</p>"
			doc.body.appendChild(element);
		
			const modifications = await applyModification(doc.body, modification, doc);
			modifications.unapply();

			expect(element.innerHTML).toMatchIgnoringMocksiTags("<p>The office of the \"President of the <a href=\"/wiki/People%27s_Committee_of_Siam\" title=\"People's Committee of Siam\">People's Committee</a>\" (<span title=\"Thai-language text\"><span lang=\"th\">ประธานคณะกรรมการราษฎร</span></span>), later changed to \"Prime Minister of Siam\" (<span title=\"Thai-language text\"><span lang=\"th\">นายกรัฐมนตรีสยาม</span></span>), was first created in the <a href=\"/wiki/Constitution_of_Thailand#1932_Temporary_Charter\" title=\"Constitution of Thailand\">Temporary Constitution of 1932</a>. The office was modeled after the <a href=\"/wiki/Prime_Minister_of_the_United_Kingdom\" title=\"Prime Minister of the United Kingdom\">prime minister of the United Kingdom</a>, as Siam became a <a href=\"/wiki/Parliamentary_democracy\" class=\"mw-redirect\" title=\"Parliamentary democracy\">parliamentary democracy</a> in 1932 after a <a href=\"/wiki/Siamese_revolution_of_1932\" title=\"Siamese revolution of 1932\">bloodless revolution</a>. However, the idea of a separate head of government in Thailand is not new.</p>");
		});

		it("should append content correctly", async () => {
			const modification: Modification = {
				action: "append",
				content: "<p>New Content</p>",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			const inner = doc.createElement("div");
			inner.innerHTML = "<p>Initial Content</p>";
			element.appendChild(inner);
			await applyModification(inner, modification, doc);

			expect(element.innerHTML).toMatchIgnoringMocksiTags(
				"<div><p>Initial Content</p><p>New Content</p></div>",
			);
		});

		it("should unapply appended content correctly", async () => {
			const modification: Modification = {
				action: "append",
				content: "<p>New Content<p>",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			const inner = doc.createElement("div");
			inner.innerHTML = "<p>Initial Content</p>";
			element.appendChild(inner);
			const modifications = await applyModification(inner, modification, doc);
			modifications.unapply();

			expect(element.innerHTML).toMatchIgnoringMocksiTags("<div><p>Initial Content</p></div>");
		});

		it("should prepend content correctly", async () => {
			const modification: Modification = {
				action: "prepend",
				content: "<p>New Content</p>",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			const inner = doc.createElement("div");
			inner.innerHTML = "<p>Initial Content</p>";
			element.appendChild(inner);
			await applyModification(inner, modification, doc);

			expect(element.innerHTML).toMatchIgnoringMocksiTags(
				"<div><p>New Content</p><p>Initial Content</p></div>",
			);
		});

		it("should unapply prepend content correctly", async () => {
			const modification: Modification = {
				action: "prepend",
				content: "<p>New Content</p>",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			const inner = doc.createElement("div");
			inner.innerHTML = "<p>Initial Content</p>";
			element.appendChild(inner);
			const modifications = await applyModification(inner, modification, doc);
			modifications.unapply();

			expect(element.innerHTML).toMatchIgnoringMocksiTags("<div><p>Initial Content</p></div>");
		});

		it("should remove the element correctly", async () => {
			const modification: Modification = {
				action: "remove",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			const inner = doc.createElement("p");
			inner.innerHTML = "Initial Content";
			element.appendChild(inner);
			await applyModification(inner, modification, doc);

			expect(element.outerHTML).toBe("<div></div>");
		});

		it("should unapply the remove element correctly", async () => {
			const modification: Modification = {
				action: "remove",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			const inner = doc.createElement("p");
			inner.innerHTML = "Initial Content";
			element.appendChild(inner);
			const modifications = await applyModification(inner, modification, doc);
			modifications.unapply();

			expect(element.outerHTML).toBe("<div><p>Initial Content</p></div>");
		});

		it("should remove the element correctly with siblings", async () => {
			const modification: Modification = {
				action: "remove",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			const inner1 = doc.createElement("p");
			inner1.innerHTML = "Inner child 1";
			element.appendChild(inner1);
			const inner2 = doc.createElement("p");
			inner2.innerHTML = "Inner child 2";
			element.appendChild(inner2);
			const inner3 = doc.createElement("p");
			inner3.innerHTML = "Inner child 3";
			element.appendChild(inner3);
			await applyModification(inner2, modification, doc);

			expect(element.outerHTML).toBe(
				"<div><p>Inner child 1</p><p>Inner child 3</p></div>",
			);
		});

		it("should unapply the remove element correctly with siblings", async () => {
			const modification: Modification = {
				action: "remove",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			const inner1 = doc.createElement("p");
			inner1.innerHTML = "Inner child 1";
			element.appendChild(inner1);
			const inner2 = doc.createElement("p");
			inner2.innerHTML = "Inner child 2";
			element.appendChild(inner2);
			const inner3 = doc.createElement("p");
			inner3.innerHTML = "Inner child 3";
			element.appendChild(inner3);
			const modifications = await applyModification(inner2, modification, doc);
			modifications.unapply();

			expect(element.outerHTML).toBe(
				"<div><p>Inner child 1</p><p>Inner child 2</p><p>Inner child 3</p></div>",
			);
		});

		it("should swap image source correctly", async () => {
			const modification: Modification = {
				action: "swapImage",
				imageUrl: "new-image-url.jpg",
			};
			const element = doc.createElement("img");
			doc.body.appendChild(element);
			element.src = "old-image-url.jpg";
			await applyModification(element, modification, doc);

			expect(element.src).toBe("new-image-url.jpg");
		});

		it("should unapply the swap image source correctly", async () => {
			const modification: Modification = {
				action: "swapImage",
				imageUrl: "new-image-url.jpg",
			};
			const element = doc.createElement("img");
			doc.body.appendChild(element);
			element.src = "old-image-url.jpg";
			const modifications = await applyModification(element, modification, doc);
			modifications.unapply();

			expect(element.src).toBe("old-image-url.jpg");
		});

		it("should highlight element correctly", async () => {
			const modification: Modification = {
				action: "highlight",
				highlightStyle: "2px solid green",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			element.innerHTML = "<p>Content</p>";
			await applyModification(element, modification, doc);

			expect(element.style.border).toBe("2px solid green");
		});

		it("should create and display a toast correctly", async () => {
			const modification: Modification = {
				action: "toast",
				toastMessage: "Test Notification",
				duration: 100,
			};
			createToast(modification.toastMessage ?? "", doc, modification.duration);

			// Simulate checking if the toast exists
			const toastElement = doc.querySelector(".bg-blue-500"); // Assuming '.bg-blue-500' is the class for the toast
			expect(toastElement?.textContent).toBe("Test Notification");

			// Simulate waiting for the toast to be removed
			await new Promise((resolve) => setTimeout(resolve, 200));

			expect(doc.querySelector(".bg-blue-500")).toBeNull();
		});

		it("should add a component correctly", async () => {
			const modification: Modification = {
				action: "addComponent",
				componentHtml: "<span>Component Content</span>",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			const inner = doc.createElement("p");
			inner.innerHTML = "Initial Content";
			element.appendChild(inner);
			await applyModification(inner, modification, doc);

			expect(element.innerHTML).toMatchIgnoringMocksiTags(
				"<p>Initial Content<span>Component Content</span></p>",
			);
		});

		it("should unapply the add component correctly", async () => {
			const modification: Modification = {
				action: "addComponent",
				componentHtml: "<span>Component Content</span>",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			const inner = doc.createElement("p");
			inner.innerHTML = "Initial Content";
			element.appendChild(inner);
			const modifications = await applyModification(inner, modification, doc);
			modifications.unapply();

			expect(element.innerHTML).toMatchIgnoringMocksiTags("<p>Initial Content</p>");
		});

		it("should handle unknowns correctly", async () => {
			const modification: Modification = {
				action: "unknown",
				componentHtml: "<span>Component Content</span>",
			};
			const element = doc.createElement("div");
			doc.body.appendChild(element);
			element.innerHTML = "<p>Initial Content</p>";
			await applyModification(element, modification, doc);

			expect(element.innerHTML).toContain("<p>Initial Content</p>");
		});
	});

	describe("createToast", () => {
		it("should create and remove a toast correctly", async () => {
			const message = "Test Message";
			createToast(message, doc);

			// Check if the toast exists
			const toastElement = doc.querySelector(".bg-blue-500");
			expect(toastElement?.textContent).toBe(message);

			// Wait for the timeout before removing the toast
			await new Promise((resolve) => setTimeout(resolve, 3100)); // Adjusted slightly above the 3000ms to account for any delays

			expect(doc.querySelector(".bg-blue-500")).toBeNull();
		});
	});

	describe("generateModifications", () => {
		it("should handle empty selectors gracefully", async () => {
			const request: ModificationRequest = {
				modifications: [
					{
						selector: "",
						action: "replace",
						content: "<p>New Content</p>",
					},
				],
				description: "",
			};

			await generateModifications(request, doc);
		});
	});
});
