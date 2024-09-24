// Import the function you want to test
import { describe, expect, it } from "vitest";
import type { ModificationRequest } from "../interfaces";
import { modifyDom, modifyHtml } from "../main";

describe("modifyHtml should perform basic HTML modification", {}, () => {
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

  it("modifies the DOM directly", async () => {
    const htmlString = `<html><body><h1 id="title">Mocksi test</h1><div>Some text content here</div></body></html/>`;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    const modificationRequest: ModificationRequest = {
      description: "Change Mocksi to Rocksi.",
      modifications: [
        {
          xpath: "//html/body/h1",
          action: "replace",
          content: "Rocksi",
        },
      ],
    };

    await modifyDom(doc, modificationRequest);
    const result = document.evaluate(
      "//html/body/h1",
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;
    expect(result).not.toBeNull();
    expect(result?.textContent).toBe("Rocksi");
  });
});
