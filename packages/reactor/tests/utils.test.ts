import { beforeEach, describe, expect, it } from "vitest";
import type { Modification, ModificationRequest } from "../interfaces";
// utils.test.ts
import { applyModification, createToast } from "../utils";
import { generateModifications } from "../utils";

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
			element.innerHTML = "<p>Old Content</p>";
			await applyModification(element, modification, doc);

			expect(element.innerHTML).toBe("<p>New Content</p>");
		});

		it("should append content correctly", async () => {
			const modification: Modification = {
				action: "append",
				content: "<p>New Content</p>",
			};
			const element = doc.createElement("div");
			element.innerHTML = "<p>Initial Content</p>";
			await applyModification(element, modification, doc);

			expect(element.innerHTML).toBe(
				"<p>Initial Content</p><p>New Content</p>",
			);
		});

		it("should append content correctly", async () => {
			const modification: Modification = {
				action: "append",
				content: "<p>New Content</p>",
			};
			const element = doc.createElement("div");
			element.innerHTML = "<p>Initial Content</p>";
			await applyModification(element, modification, doc);

			expect(element.innerHTML).toBe(
				"<p>Initial Content</p><p>New Content</p>",
			);
		});

		it("should prepend content correctly", async () => {
			const modification: Modification = {
				action: "prepend",
				content: "<p>New Content</p>",
			};
			const element = doc.createElement("div");
			element.innerHTML = "<p>Initial Content</p>";
			await applyModification(element, modification, doc);

			expect(element.innerHTML).toBe(
				"<p>New Content</p><p>Initial Content</p>",
			);
		});

		it("should remove the element correctly", async () => {
			const modification: Modification = {
				action: "remove",
			};
			const element = doc.createElement("div");
			element.innerHTML = "<p>Content</p>";
			await applyModification(element, modification, doc);

			expect(element.parentElement).toBeNull();
		});

        it("should ignore invalid selectors", async () => {
            const modification: Modification = {
                action: "replace",
                content: "<p>New Content</p>",
                selector: "#;3s92hn"
            };
            const element = doc.createElement("div");
            element.innerHTML = "<p>Old Content</p>";
            await applyModification(element, modification, doc);

			expect(element.parentElement).toBeNull();
        });

		it("should swap image source correctly", async () => {
			const modification: Modification = {
				action: "swapImage",
				imageUrl: "new-image-url.jpg",
			};
			const element = doc.createElement("img");
			element.src = "old-image-url.jpg";
			await applyModification(element, modification, doc);

			expect(element.src).toBe("new-image-url.jpg");
		});

		it("should highlight element correctly", async () => {
			const modification: Modification = {
				action: "highlight",
				highlightStyle: "2px solid green",
			};
			const element = doc.createElement("div");
			element.innerHTML = "<p>Content</p>";
			await applyModification(element, modification, doc);

			expect(element.style.border).toBe("2px solid green");
		});

		it("should create and display a toast correctly", async () => {
			const modification: Modification = {
				action: "toast",
				toastMessage: "Test Notification",
			};
			createToast(modification.toastMessage ?? "", doc);

			// Simulate checking if the toast exists
			const toastElement = doc.querySelector(".bg-blue-500"); // Assuming '.bg-blue-500' is the class for the toast
			expect(toastElement?.textContent).toBe("Test Notification");

			// Simulate waiting for the toast to be removed
			await new Promise((resolve) => setTimeout(resolve, 3100));

			expect(doc.querySelector(".bg-blue-500")).toBeNull();
		});

		it("should add a component correctly", async () => {
			const modification: Modification = {
				action: "addComponent",
				componentHtml: "<span>Component Content</span>",
			};
			const element = doc.createElement("div");
			element.innerHTML = "<p>Initial Content</p>";
			await applyModification(element, modification, doc);

			expect(element.innerHTML).toContain("<span>Component Content</span>");
		});

		it("should handle unknowns correctly", async () => {
			const modification: Modification = {
				action: "unknown",
				componentHtml: "<span>Component Content</span>",
			};
			const element = doc.createElement("div");
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
                description: ""
            };

			await generateModifications(request, doc);
		});
	});
});
