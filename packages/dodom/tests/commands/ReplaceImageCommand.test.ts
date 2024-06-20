import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ReplaceImageCommand } from "../../commands/ReplaceImageCommand";
import { ShadowDOMManipulator } from "../../receivers/ShadowDOMManipulator";
import { fragmentTextNode } from "../../utils";
import type { UUIDGenerator } from "../../utils/UUIDGenerator";

describe("ReplaceImageCommand", () => {
	let shadowRoot: ShadowRoot;
	let uuidGenerator: UUIDGenerator;
	let manipulator: ShadowDOMManipulator;

	beforeEach(() => {
		const shadowHost = document.createElement("div");
		shadowHost.id = "my-shadow-root";
		document.body.appendChild(shadowHost);
		shadowRoot = shadowHost.attachShadow({ mode: "open" });
		uuidGenerator = {
			generate: () => "mocksi-1234",
		} as UUIDGenerator;
		const saveModification = () => {};
		const contentHighlighter = { highlightNode: () => {} };
		manipulator = new ShadowDOMManipulator(
			shadowRoot,
			fragmentTextNode,
			saveModification,
			contentHighlighter,
			uuidGenerator,
		);
	});

	afterEach(() => {
		document.body.innerHTML = "";
		manipulator.disconnectObserver();
	});

	it("should replace image source and undo the replacement", () => {
		shadowRoot.innerHTML =
			'<img src="https://example.com/old.jpg" alt="Old Image 1">';

		const command = new ReplaceImageCommand(
			manipulator,
			"https://example.com/old.jpg",
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...=",
		);

		command.execute();
		expect(shadowRoot.innerHTML).toContain(
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...=",
		);
		expect(shadowRoot.innerHTML).toContain("mocksi-1234");

		command.undo();
		expect(shadowRoot.innerHTML).toContain("https://example.com/old.jpg");
	});
});
