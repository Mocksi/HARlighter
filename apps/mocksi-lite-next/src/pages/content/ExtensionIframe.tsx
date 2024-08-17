import { useRef } from "react";

function ExtensionIframe() {
  const iframeRef = useRef();
  return (
    <iframe
      ref={iframeRef.current}
      src="http://localhost:3030/extension"
      style={{
        height: "800px",
        width: "500px",
      }}
    />
  );
}

export default ExtensionIframe;
