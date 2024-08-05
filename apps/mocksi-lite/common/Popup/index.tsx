import { useEffect, useState } from "react";
import { MOCKSI_POPUP_LOCATION } from "../../consts";
import IframeWrapper from "../../content/IframeWrapper";
import Divider from "../Divider";
import Draggable from "./Draggable";
import Footer from "./Footer";
import Header from "./Header";

interface PopupProps {
  children: React.ReactNode;
  email?: string;
  headerSubtitle?: string;
  shouldDisplayFooter?: boolean;
  onChat?: () => void;
  onClose: () => void;
  onGoBack?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
}

const Popup = ({
  children,
  email,
  headerSubtitle,
  onChat,
  onClose,
  onGoBack,
  onLogout,
  onSettings,
  shouldDisplayFooter,
}: PopupProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const onDragStop =
    () =>
    (
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      event: any,
      data: { x: number; y: number },
    ) => {
      if (data.x === 0 || data.y === 0) {
        return;
      }

      setPosition({ x: data.x, y: data.y });

      chrome.storage.local.set({
        [MOCKSI_POPUP_LOCATION]: {
          x: data.x,
          y: data.y,
        },
      });
    };

  useEffect(() => {
    chrome.storage.local.get([MOCKSI_POPUP_LOCATION], (results) => {
      const location = results[MOCKSI_POPUP_LOCATION];
      if (location) {
        setPosition(location);
      }
    });
  }, []);

  const isFooterVisible = shouldDisplayFooter && email && onLogout && onChat;
  const iframeStyle = {
    border: "none",
    height: "75%",
    position: "absolute", // Fixed positioning relative to the viewport
    top: "100px",
    width: "100%",
    zIndex: 9999998,
  };

  return (
    <Draggable>
      <div className="mw-flex mw-flex-col mw-justify-between mw-bg-white shadow-lg mw-m-4 mw-border-black mw-border-solid mw-rounded-lg mw-h-[596px] mw-w-[500px]">
        <Header
          close={onClose}
          onGoBack={onGoBack}
          onSettings={onSettings}
          subtitle={headerSubtitle}
        />
        <IframeWrapper style={iframeStyle}>{children}</IframeWrapper>

        {/* FOOTER */}
        {isFooterVisible && (
          <div>
            <Divider />
            <Footer email={email} onChat={onChat} onLogout={onLogout} />
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default Popup;
