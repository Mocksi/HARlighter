var height = "40px";
var iframe = document.createElement("iframe");
iframe.src = chrome.runtime.getURL("toolbar.html");
iframe.style.height = height;
iframe.style.width = "100%";
iframe.style.position = "fixed";
iframe.style.top = "0";
iframe.style.border = "none";
iframe.style.left = "0";
iframe.style.backgroundColor = "white";
iframe.style.borderBottom = "1px solid lightgrey";
iframe.style.zIndex = "999999";

document.documentElement.appendChild(iframe);

var bodyStyle = document.body.style;
bodyStyle.backgroundColor = "white";
bodyStyle.scrollMarginTop = "50px";
var cssTransform = "transform" in bodyStyle ? "transform" : "webkitTransform";
bodyStyle.transform = "translate(0," + height + ")";
