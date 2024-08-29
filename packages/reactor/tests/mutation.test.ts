import { describe, expect, it, beforeEach } from "vitest";
import { extendExpect } from "./test.utils";
import type { ModificationRequest } from "../interfaces";
import Reactor from "../reactor";

extendExpect(expect);

describe("test mutation listeners", {}, () => {
    let doc: Document;
    let reactor: Reactor;

	// Vitest beforeEach function for setup
	beforeEach(() => {
		doc = document.implementation.createHTMLDocument("Test Document");
        
        reactor = new Reactor();
        reactor.attach(doc, {
            highlightNode: (elementToHighlight: Node) => {},
	        removeHighlightNode: (elementToUnhighlight: Node) => {}
        });
	});

    it("should handle an added mutation", async () => {
        doc.body.innerHTML = "<h1>train</h1><h2>about</h2><div>Trains are really cool. I use my train every day.</div>";
        
        const request: ModificationRequest = {
            description: "Change train to brain",
            modifications: [
                {
                    selector: "body",
                    action: "replaceAll",
                    content: "/train/brain/wip",
                }
            ],
        };

        await reactor.pushModification(request);
        expect(doc.body.innerHTML).toMatchIgnoringMocksiTags("<h1>brain</h1><h2>about</h2><div>Brains are really cool. I use my brain every day.</div>");

        doc.body.innerHTML = "<h1>trains are uncool</h1><h2>avoid</h2><div>I hate trains. I never ride them.</div>";
        // wait for the changes to be applied
        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(doc.body.innerHTML).toMatchIgnoringMocksiTags("<h1>brains are uncool</h1><h2>avoid</h2><div>I hate brains. I never ride them.</div>");
    });

    it("should handle undoing after an added mutation", async () => {
        doc.body.innerHTML = "<h1>train</h1><h2>about</h2><div>Trains are really cool. I use my train every day.</div>";
        
        const request: ModificationRequest = {
            description: "Change train to brain",
            modifications: [
                {
                    selector: "body",
                    action: "replaceAll",
                    content: "/train/brain/",
                }
            ],
        };

        await reactor.pushModification(request);
        doc.body.innerHTML = "<h1>trains are uncool</h1><h2>avoid</h2><div>I hate trains. I never ride them.</div>";
        // wait for the changes to be applied
        await new Promise(resolve => setTimeout(resolve, 1000));
        reactor.detach();

        expect(doc.body.innerHTML).toMatchIgnoringMocksiTags("<h1>trains are uncool</h1><h2>avoid</h2><div>I hate trains. I never ride them.</div>");
    });
});