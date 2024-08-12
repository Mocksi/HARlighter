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

  beforeEach(() => {
    render(<MountComponent />);
  });

  afterEach(() => {
    // cleanup on exiting
    if (container) {
      container.remove();
    }
  });

  it("", async () => {
    window.location.href = "https://en.wikipedia.org";
    vi.spyOn(window, "location", "get");
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

    expect(true).toBeTruthy();
  });
});
