import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useImages from "./useImages";

describe("useImages hook", () => {
  function MountComponent() {
    const images = useImages();

    return <div>{JSON.stringify(images)}</div>;
  }
  const container = document.createElement("div");

  beforeEach(() => {});

  afterEach(() => {
    // cleanup on exiting
    if (container) {
      container.remove();
    }
  });

  it("", async () => {
    global.jsdom.fromURL("https://en.wikipedia.org", {}).then((dom) => {
      console.log(dom.serialize());
    });

    await chrome.storage.local.set(
      {
        "mocksi-images": {
          "en.wikipedia.org": {
            [""]: {},
          },
        },
      },
      () => {
        console.log();
      },
    );

    render(<MountComponent />);

    expect(true).toBeTruthy();
  });
});
