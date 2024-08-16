import { useEffect, useRef } from "react";

function EnFrame() {
  const iframeRef = useRef();

  document.body.addEventListener("click", (event) => {
    chrome.runtime.sendMessage(
      `${event.target} clicked in main document`,
      (response) => {
        console.log("response from background script", response);
      },
    );
  });

  useEffect(() => {
    if (iframeRef.current) {
      const el: HTMLElement = iframeRef.current;
      el.addEventListener("click", (event) => {
        console.log(event.target);
      });
    }
  }, []);

  return (
    <iframe
      ref={iframeRef.current}
      src="https://nest-auth-ts-merge.onrender.com"
    />
  );
}

function AppIframe() {
  return <EnFrame />;
}

export default AppIframe;
